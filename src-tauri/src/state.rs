use syntect::highlighting::{Theme, ThemeSet};
use syntect::parsing::SyntaxSet;

pub struct State {
    pub syntax_color: SyntaxColor,
}

pub struct SyntaxColor {
    pub theme: Theme,
    pub ps: SyntaxSet,
    pub ts: ThemeSet,
}

impl Default for State {
    fn default() -> Self {
        let ps = SyntaxSet::load_defaults_newlines();
        let ts = ThemeSet::load_defaults();
        let theme = ts.themes["base16-ocean.dark"].clone();
        State {
            syntax_color: SyntaxColor { theme, ps, ts },
        }
    }
}
