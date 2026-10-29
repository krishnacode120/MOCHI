# Third-party notices

Mochi and Pip's original programmatic artwork, SVG portrait, icons, and project source are included under the repository's MIT license. No paid stock assets, fonts, music, or API services are required. System fonts are used. Sounds are generated locally.

Direct JavaScript dependencies resolved in package-lock.json on 25 October 2026:

| Component | Version | License |
| --- | --- | --- |
| React / React DOM | 19.3.1 | MIT |
| PixiJS | 8.22.0 | MIT |
| GSAP | 3.15.0 | GSAP Standard License (not MIT) |
| Zustand | 5.0.16 | MIT |
| Tauri API / CLI | 2.12.4 | MIT OR Apache-2.0 |
| TypeScript | 5.9.3 | Apache-2.0 |
| Vite | 6.4.5 | MIT |
| Vitest | 3.2.7 | MIT |

Rust dependencies are resolved in Cargo.lock, including Tauri 2.12.5, autostart 2.7.0, single-instance 2.5.4, and Microsoft windows 0.62.2. Cargo.lock records the exact transitive versions.

GSAP is free to use for this application under its own standard license; its terms remain applicable and the repository MIT license does not relicense it. See the installed package's README and [GSAP licensing](https://gsap.com/standard-license/). Retain dependency license notices in any distribution. Microsoft WebView2 is a separately installed system runtime governed by Microsoft's terms.

The packaged frontend preserves dependency legal comments through Vite's bundling. `npm run licenses` generates `licenses/THIRD_PARTY_LICENSES.txt` from the installed production npm packages and the locked Windows Rust dependency graph. The production build regenerates this inventory and packages it alongside this notice and the project license.

## Character references

WALL-E and Olaf are Disney/Pixar characters; Spider-Man belongs to Marvel, and Monkey D. Luffy is a character by Eiichiro Oda, associated with Shueisha and Toei Animation. This project includes unofficial, stylized fan interpretations drawn procedurally in code, alongside the original Mochi and Pip designs. No official sprites, film frames, music, or voice tracks are bundled. Character names and source designs are not original MOCHI creations.
