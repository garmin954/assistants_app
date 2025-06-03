use tauri_build::WindowsAttributes;

fn main() {
    let mut windows = WindowsAttributes::new();

    // Only set the windows attributes for release builds
    if !cfg!(debug_assertions) {
        windows = windows.app_manifest(
            r#"
            <assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
              <dependency>
                <dependentAssembly>
                  <assemblyIdentity
                    type="win32"
                    name="Microsoft.Windows.Common-Controls"
                    version="6.0.0.0"
                    processorArchitecture="*"
                    publicKeyToken="6595b64144ccf1df"
                    language="*"
                  />
                </dependentAssembly>
              </dependency>
              <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
                <security>
                    <requestedPrivileges>
                        <requestedExecutionLevel level="requireAdministrator" uiAccess="false" />
                    </requestedPrivileges>
                </security>
              </trustInfo>
            </assembly>
            "#,
        );
    }

    tauri_build::try_build(
        tauri_build::Attributes::new()
            .windows_attributes(windows)
            .plugin(
                "commands",
                tauri_build::InlinedPlugin::new().commands(&[
                    "app_exit",
                    "open_server",
                    "system_info",
                    "quit_server",
                    "start_server",
                    "get_server_state",
                    "find_latest_firmware",
                    "open_studio_window",
                    "start_udp_broadcast",
                    "stop_udp_broadcast",
                    "fetch_history_releases",
                    "download_resources",
                    "update_config_ini",
                    "updater_service",
                    "set_beta_updater",
                    "set_stable_updater",
                ]),
            ),
    )
    .expect("failed to run tauri-build");
}
