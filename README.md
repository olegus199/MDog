# MDog

To start an app in dev mode run the following commands:

```bash
npm install
npm run tauri dev
```

To build run

```bash
npm install # If you didn't run the command before
npm run tauri build
```

![main_window](https://github.com/olegus199/MDog/assets/128966780/8ba9bc34-5b2c-4289-bafd-4125c8958a9a)

On a mac:

When an application gets downloaded from any source other than those that Apple seems suited, the application gets an extended attribute "com.apple.Quarantine". This triggers the message:

<img width="372" alt="Screenshot 2023-11-28 at 11 11 02" src="https://github.com/olegus199/MDog/assets/109857267/e72d9160-7ddc-497e-a49b-9bcd57df16de">

To fix that type in terminal:
```bash
xattr -c MDog.app/Contents/MacOS/MDog
```
This happens on macos `13.6.1` but not on `10.15`, so act according to the situation.
