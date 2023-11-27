use std::collections::HashMap;
use std::fs::File;
use std::io;
use std::io::BufReader;
use std::io::Error;
use std::io::Read;
use std::path::Path;
use std::path::PathBuf;

use base64::engine::general_purpose;
use base64::Engine;
use pulldown_cmark;
use pulldown_cmark::escape::escape_href;
use pulldown_cmark::escape::escape_html;
use pulldown_cmark::escape::StrWrite;
use pulldown_cmark::Alignment;
use pulldown_cmark::CodeBlockKind;
use pulldown_cmark::CowStr;
use pulldown_cmark::Event;
use pulldown_cmark::Event::*;
use pulldown_cmark::LinkType;
use pulldown_cmark::Tag;

use syntect::easy::HighlightLines;
use syntect::highlighting::Style;
use syntect::html::append_highlighted_html_for_styled_line;
use syntect::util::LinesWithEndings;

use crate::state::SyntaxColor;

struct CodeStylizer {
    syntax_color: SyntaxColor,
}

impl CodeStylizer {
    fn stylize_code(&self, code: &str, lang_ext: &str) -> Result<String, syntect::Error> {
        let syntax = self
            .syntax_color
            .ps
            .find_syntax_by_extension(lang_ext)
            .unwrap_or_else(|| {
                self.syntax_color
                    .ps
                    .find_syntax_by_first_line(code)
                    .unwrap_or_else(|| self.syntax_color.ps.find_syntax_plain_text())
            });
        let mut h = HighlightLines::new(syntax, &self.syntax_color.theme);
        let mut html = String::new();
        for line in LinesWithEndings::from(code) {
            let ranges: Vec<(Style, &str)> = h.highlight_line(line, &self.syntax_color.ps)?;
            append_highlighted_html_for_styled_line(
                &ranges[..],
                syntect::html::IncludeBackground::No,
                &mut html,
            )?;
        }
        Ok(html)
    }
}

enum TableState {
    Head,
    Body,
}

struct HtmlWriter<'a, I, W> {
    /// Iterator supplying events.
    iter: I,

    /// Writer to write to.
    writer: W,

    /// Whether or not the last write wrote a newline.
    end_newline: bool,

    is_in_code_block: bool,
    // FIXME: String possibly is too slow here
    current_lang: String,
    file_path: PathBuf,

    code_stylizer: CodeStylizer,
    table_state: TableState,
    table_alignments: Vec<Alignment>,
    table_cell_index: usize,
    numbers: HashMap<CowStr<'a>, usize>,
}

impl<'a, I, W> HtmlWriter<'a, I, W>
where
    I: Iterator<Item = Event<'a>>,
    W: StrWrite,
{
    fn new(iter: I, writer: W, code_stylizer: CodeStylizer, file_path: PathBuf) -> Self {
        Self {
            iter,
            writer,
            end_newline: true,
            is_in_code_block: false,
            current_lang: String::new(),
            file_path,
            code_stylizer,
            table_state: TableState::Head,
            table_alignments: vec![],
            table_cell_index: 0,
            numbers: HashMap::new(),
        }
    }

    /// Writes a new line.
    fn write_newline(&mut self) -> io::Result<()> {
        self.end_newline = true;
        self.writer.write_str("\n")
    }

    /// Writes a buffer, and tracks whether or not a newline was written.
    #[inline]
    fn write(&mut self, s: &str) -> io::Result<()> {
        self.writer.write_str(s)?;

        if !s.is_empty() {
            self.end_newline = s.ends_with('\n');
        }
        Ok(())
    }

    fn run(mut self) -> io::Result<()> {
        while let Some(event) = self.iter.next() {
            match event {
                Start(tag) => {
                    self.start_tag(tag)?;
                }
                End(tag) => {
                    self.end_tag(tag)?;
                }
                Text(text) => {
                    if self.is_in_code_block {
                        let stylized = self
                            .code_stylizer
                            .stylize_code(&text, &self.current_lang)
                            .map_err(|e| std::io::Error::new(io::ErrorKind::Other, e))?;
                        self.write(&stylized)?;
                        self.is_in_code_block = false;
                    } else {
                        escape_html(&mut self.writer, &text)?;
                        self.end_newline = text.ends_with('\n');
                    }
                }
                Code(text) => {
                    self.write("<code>")?;
                    // let stylized = self
                    //     .code_stylizer
                    //     .stylize_code(&text, &self.current_lang)
                    //     .map_err(|e| std::io::Error::new(io::ErrorKind::Other, e))?;
                    // self.write(&stylized)?;
                    escape_html(&mut self.writer, &text)?;
                    self.write("</code>")?;
                }
                Html(html) => {
                    self.write(&html)?;
                }
                SoftBreak => {
                    self.write_newline()?;
                }
                HardBreak => {
                    self.write("<br />\n")?;
                }
                Rule => {
                    if self.end_newline {
                        self.write("<hr />\n")?;
                    } else {
                        self.write("\n<hr />\n")?;
                    }
                }
                FootnoteReference(name) => {
                    let len = self.numbers.len() + 1;
                    self.write("<sup class=\"footnote-reference\"><a href=\"#")?;
                    escape_html(&mut self.writer, &name)?;
                    self.write("\">")?;
                    let number = *self.numbers.entry(name).or_insert(len);
                    write!(&mut self.writer, "{}", number)?;
                    self.write("</a></sup>")?;
                }
                TaskListMarker(true) => {
                    self.write("<input disabled=\"\" type=\"checkbox\" checked=\"\"/>\n")?;
                }
                TaskListMarker(false) => {
                    self.write("<input disabled=\"\" type=\"checkbox\"/>\n")?;
                }
            }
        }
        Ok(())
    }

    /// Writes the start of an HTML tag.
    fn start_tag(&mut self, tag: Tag<'a>) -> io::Result<()> {
        match tag {
            Tag::Paragraph => {
                if self.end_newline {
                    self.write("<p>")
                } else {
                    self.write("\n<p>")
                }
            }
            Tag::Heading(level, id, classes) => {
                if self.end_newline {
                    self.end_newline = false;
                    self.write("<")?;
                } else {
                    self.write("\n<")?;
                }
                write!(&mut self.writer, "{}", level)?;
                if let Some(id) = id {
                    self.write(" id=\"")?;
                    escape_html(&mut self.writer, id)?;
                    self.write("\"")?;
                }
                let mut classes = classes.iter();
                if let Some(class) = classes.next() {
                    self.write(" class=\"")?;
                    escape_html(&mut self.writer, class)?;
                    for class in classes {
                        self.write(" ")?;
                        escape_html(&mut self.writer, class)?;
                    }
                    self.write("\"")?;
                }
                self.write(">")
            }
            Tag::Table(alignments) => {
                self.table_alignments = alignments;
                self.write("<table>")
            }
            Tag::TableHead => {
                self.table_state = TableState::Head;
                self.table_cell_index = 0;
                self.write("<thead><tr>")
            }
            Tag::TableRow => {
                self.table_cell_index = 0;
                self.write("<tr>")
            }
            Tag::TableCell => {
                match self.table_state {
                    TableState::Head => {
                        self.write("<th")?;
                    }
                    TableState::Body => {
                        self.write("<td")?;
                    }
                }
                match self.table_alignments.get(self.table_cell_index) {
                    Some(&Alignment::Left) => self.write(" style=\"text-align: left\">"),
                    Some(&Alignment::Center) => self.write(" style=\"text-align: center\">"),
                    Some(&Alignment::Right) => self.write(" style=\"text-align: right\">"),
                    _ => self.write(">"),
                }
            }
            Tag::BlockQuote => {
                if self.end_newline {
                    self.write("<blockquote>\n")
                } else {
                    self.write("\n<blockquote>\n")
                }
            }
            Tag::CodeBlock(info) => {
                if !self.end_newline {
                    self.write_newline()?;
                }
                match info {
                    CodeBlockKind::Fenced(info) => {
                        let lang = info.split(' ').next().unwrap();
                        if lang.is_empty() {
                            self.write("<pre><code>")
                        } else {
                            // self.write("<pre><code class=\"language-")?;
                            // escape_html(&mut self.writer, lang)?;
                            // self.write("\">")
                            self.is_in_code_block = true;
                            self.current_lang = String::from(lang);
                            self.write("<pre><code>")
                        }
                    }
                    CodeBlockKind::Indented => {
                        self.is_in_code_block = true;
                        self.write("<pre><code>")
                    }
                }
            }
            Tag::List(Some(1)) => {
                if self.end_newline {
                    self.write("<ol>\n")
                } else {
                    self.write("\n<ol>\n")
                }
            }
            Tag::List(Some(start)) => {
                if self.end_newline {
                    self.write("<ol start=\"")?;
                } else {
                    self.write("\n<ol start=\"")?;
                }
                write!(&mut self.writer, "{}", start)?;
                self.write("\">\n")
            }
            Tag::List(None) => {
                if self.end_newline {
                    self.write("<ul>\n")
                } else {
                    self.write("\n<ul>\n")
                }
            }
            Tag::Item => {
                if self.end_newline {
                    self.write("<li>")
                } else {
                    self.write("\n<li>")
                }
            }
            Tag::Emphasis => self.write("<em>"),
            Tag::Strong => self.write("<strong>"),
            Tag::Strikethrough => self.write("<del>"),
            Tag::Link(LinkType::Email, dest, title) => {
                self.write("<a href=\"mailto:")?;
                escape_href(&mut self.writer, &dest)?;
                if !title.is_empty() {
                    self.write("\" title=\"")?;
                    escape_html(&mut self.writer, &title)?;
                }
                self.write("\">")
            }
            Tag::Link(_link_type, dest, title) => {
                self.write("<a href=\"")?;
                escape_href(&mut self.writer, &dest)?;
                if !title.is_empty() {
                    self.write("\" title=\"")?;
                    escape_html(&mut self.writer, &title)?;
                }
                self.write("\">")
            }
            Tag::Image(_link_type, dest, title) => {
                let parent = self
                    .file_path
                    .parent()
                    .ok_or(std::io::Error::new(
                        io::ErrorKind::NotFound,
                        "Failed to get parent from path",
                    ))?
                    .to_str()
                    .ok_or(std::io::Error::new(
                        io::ErrorKind::Other,
                        "Failed to parse path to str",
                    ))?;
                let path = format!("{}/{}", parent, dest);
                if let Ok(file) = File::open(path) {
                    self.embed_image(file)?;
                } else {
                    self.write("<img src=\"")?;
                    escape_href(&mut self.writer, &dest)?;
                }
                self.write("\" alt=\"")?;
                self.raw_text()?;
                if !title.is_empty() {
                    self.write("\" title=\"")?;
                    escape_html(&mut self.writer, &title)?;
                }
                self.write("\" />")
            }
            Tag::FootnoteDefinition(name) => {
                if self.end_newline {
                    self.write("<div class=\"footnote-definition\" id=\"")?;
                } else {
                    self.write("\n<div class=\"footnote-definition\" id=\"")?;
                }
                escape_html(&mut self.writer, &*name)?;
                self.write("\"><sup class=\"footnote-definition-label\">")?;
                let len = self.numbers.len() + 1;
                let number = *self.numbers.entry(name).or_insert(len);
                write!(&mut self.writer, "{}", number)?;
                self.write("</sup>")
            }
        }
    }

    fn embed_image(&mut self, file: File) -> Result<(), Error> {
        let mut img_file = BufReader::new(file);
        let mut buffer = Vec::new();
        img_file.read_to_end(&mut buffer)?;
        let img_base64 = general_purpose::STANDARD.encode(&buffer);
        let img_tag = format!("data:image/jpg;base64,{}", img_base64);
        self.write(&format!("<img src=\"{}", img_tag))?;
        Ok(())
    }

    fn end_tag(&mut self, tag: Tag) -> io::Result<()> {
        match tag {
            Tag::Paragraph => {
                self.write("</p>\n")?;
            }
            Tag::Heading(level, _id, _classes) => {
                self.write("</")?;
                write!(&mut self.writer, "{}", level)?;
                self.write(">\n")?;
            }
            Tag::Table(_) => {
                self.write("</tbody></table>\n")?;
            }
            Tag::TableHead => {
                self.write("</tr></thead><tbody>\n")?;
                self.table_state = TableState::Body;
            }
            Tag::TableRow => {
                self.write("</tr>\n")?;
            }
            Tag::TableCell => {
                match self.table_state {
                    TableState::Head => {
                        self.write("</th>")?;
                    }
                    TableState::Body => {
                        self.write("</td>")?;
                    }
                }
                self.table_cell_index += 1;
            }
            Tag::BlockQuote => {
                self.write("</blockquote>\n")?;
            }
            Tag::CodeBlock(_) => {
                self.write("</code></pre>\n")?;
            }
            Tag::List(Some(_)) => {
                self.write("</ol>\n")?;
            }
            Tag::List(None) => {
                self.write("</ul>\n")?;
            }
            Tag::Item => {
                self.write("</li>\n")?;
            }
            Tag::Emphasis => {
                self.write("</em>")?;
            }
            Tag::Strong => {
                self.write("</strong>")?;
            }
            Tag::Strikethrough => {
                self.write("</del>")?;
            }
            Tag::Link(_, _, _) => {
                self.write("</a>")?;
            }
            Tag::Image(_, _, _) => (), // shouldn't happen, handled in start
            Tag::FootnoteDefinition(_) => {
                self.write("</div>\n")?;
            }
        }
        Ok(())
    }

    // run raw text, consuming end tag
    fn raw_text(&mut self) -> io::Result<()> {
        let mut nest = 0;
        while let Some(event) = self.iter.next() {
            match event {
                Start(_) => nest += 1,
                End(_) => {
                    if nest == 0 {
                        break;
                    }
                    nest -= 1;
                }
                Html(text) | Code(text) | Text(text) => {
                    escape_html(&mut self.writer, &text)?;
                    self.end_newline = text.ends_with('\n');
                }
                SoftBreak | HardBreak | Rule => {
                    self.write(" ")?;
                }
                FootnoteReference(name) => {
                    let len = self.numbers.len() + 1;
                    let number = *self.numbers.entry(name).or_insert(len);
                    write!(&mut self.writer, "[{}]", number)?;
                }
                TaskListMarker(true) => self.write("[x]")?,
                TaskListMarker(false) => self.write("[ ]")?,
            }
        }
        Ok(())
    }
}

pub fn parse<T: AsRef<Path>>(path: T, syntax_color: SyntaxColor) -> String
where
    PathBuf: From<T>,
{
    let md_file = std::fs::read_to_string(&path)
        .map_err(|e| e.to_string())
        .unwrap();
    let parser = pulldown_cmark::Parser::new(&md_file);
    let mut output = String::new();
    let stylizer = CodeStylizer { syntax_color };
    if let Err(e) = HtmlWriter::new(parser, &mut output, stylizer, PathBuf::from(path)).run() {
        tracing::error!("Error: {}", e);
        String::from("Failed to parse input")
    } else {
        output
    }
}
