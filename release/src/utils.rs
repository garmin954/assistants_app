use pulldown_cmark::{html, Parser};
use std::fs;
use std::path::Path;
// 获取系统架构
pub fn get_arch_display_name<'a>() -> &'a str {
    let arch = std::env::consts::ARCH;
    match arch {
        "x86_64" => "x64",       // 64-bit x86
        "x86" => "x86",          // 32-bit x86
        "aarch64" => "ARM64",    // 64-bit ARM
        "arm" => "ARM",          // 32-bit ARM
        "mips" => "MIPS",        // MIPS architecture
        "powerpc" => "PowerPC",  // PowerPC architecture
        "riscv64" => "RISC-V64", // 64-bit RISC-V
        "wasm32" => "WASM32",    // WebAssembly 32-bit
        "wasm64" => "WASM64",    // WebAssembly 64-bit
        _ => arch,               // 其他未知架构
    }
}

pub fn copy_files_to_shared_dir(source_file: &Path, target_dir: &Path) -> Result<(), String> {
    let file_path = Path::new(source_file);
    let target_path = Path::new(target_dir);

    if file_path.exists() == false {
        return Err(format!("{:?} exists", file_path));
    }

    let file_name = file_path.file_name().unwrap();
    let dest_path = target_path.join(file_name);

    fs::copy(&file_path, &dest_path).map_err(|e| e.to_string())?;
    println!("Copied {:?} to {:?}", file_path, dest_path);

    Ok(())
}

pub fn md_to_html() -> Result<String, std::io::Error> {
    let md_file_path: &Path = Path::new("./README.md");
    let md_content = fs::read_to_string(md_file_path)?;

    // 将 Markdown 转换为 HTML
    let parser = Parser::new(&md_content);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    // 添加 CSS 样式以保持有序列表的原始序号
    let styled_html = format!(
        r#"<style>
            ol {{
                counter-reset: item;
                list-style-type: none;
            }}
            ol li {{
                counter-increment: item;
                margin-bottom: 10px;
            }}
            ol li:before {{
                content: counter(item) ". ";
            }}
        </style>
        {}"#,
        html_output
    );

    Ok(styled_html)
}
