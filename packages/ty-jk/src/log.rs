use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};

const MAX_LINES: usize = 20_000;
const MAX_TRASH: usize = 15;

fn timestamp() -> String {
    chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

fn agents_dir(root: &Path) -> PathBuf {
    root.join(".agents")
}

fn trash_dir(root: &Path) -> PathBuf {
    agents_dir(root).join("trash")
}

pub struct RotatingLog {
    file: File,
    line_count: usize,
    start_line: usize,
    name: String,
    last_content: String,
    repeat_count: usize,
    root: PathBuf,
}

impl RotatingLog {
    pub fn new(root: &Path, name: &str, header: Option<&str>) -> anyhow::Result<Self> {
        let agents = agents_dir(root);
        let trash = trash_dir(root);
        fs::create_dir_all(&agents)?;
        fs::create_dir_all(&trash)?;

        archive_existing(&agents, &trash);
        prune_trash(&trash);

        let file_path = agents.join(format!("output-{}-1-1.log", name));
        let mut file = File::create(&file_path)?;

        if let Some(h) = header {
            writeln!(file, "=== {} | {} ===", timestamp(), h)?;
        }

        Ok(Self {
            file,
            line_count: 0,
            start_line: 1,
            name: name.to_string(),
            last_content: String::new(),
            repeat_count: 0,
            root: root.to_path_buf(),
        })
    }

    pub fn write(&mut self, text: &str) {
        for line in text.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            if trimmed == self.last_content {
                self.repeat_count += 1;
                continue;
            }
            self.flush_pending();
            self.last_content = trimmed.to_string();
            self.repeat_count = 0;
            let formatted = format!("[{}] {}", timestamp(), trimmed);
            self.write_line(&formatted);
        }
    }

    pub fn end(&mut self) {
        self.flush_pending();
        self.finalize_file_name();
    }

    fn flush_pending(&mut self) {
        if self.repeat_count > 0 {
            let msg = format!(
                "[{}] (repeated {} more times)",
                timestamp(),
                self.repeat_count
            );
            self.write_line(&msg);
            self.repeat_count = 0;
        }
    }

    fn write_line(&mut self, formatted: &str) {
        let _ = writeln!(self.file, "{}", formatted);
        self.line_count += 1;
        if self.line_count >= MAX_LINES {
            self.rotate();
        }
    }

    fn finalize_file_name(&self) {
        let agents = agents_dir(&self.root);
        let old_name = format!("output-{}-{}-{}.log", self.name, self.start_line, self.start_line);
        let new_name = build_file_name(&self.name, self.start_line, self.start_line + self.line_count.saturating_sub(1));
        let old_path = agents.join(&old_name);
        if old_path.exists() {
            let _ = fs::rename(&old_path, agents.join(&new_name));
        }
    }

    fn rotate(&mut self) {
        self.finalize_file_name();
        let new_start = self.start_line + self.line_count;
        self.start_line = new_start;
        self.line_count = 0;

        let agents = agents_dir(&self.root);
        let file_path = agents.join(format!("output-{}-{}-{}.log", self.name, new_start, new_start));
        if let Ok(f) = File::create(&file_path) {
            self.file = f;
        }
    }
}

impl Drop for RotatingLog {
    fn drop(&mut self) {
        self.flush_pending();
    }
}

fn build_file_name(name: &str, start: usize, end: usize) -> String {
    format!("output-{}-{}-{}.log", name, start, end)
}

fn archive_existing(agents: &Path, trash: &Path) {
    if let Ok(entries) = fs::read_dir(agents) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("output-") && name.ends_with(".log") {
                let _ = fs::rename(entry.path(), trash.join(&name));
            }
        }
    }
}

fn prune_trash(trash: &Path) {
    if let Ok(entries) = fs::read_dir(trash) {
        let mut files: Vec<_> = entries
            .flatten()
            .filter(|e| e.file_type().map(|t| t.is_file()).unwrap_or(false))
            .collect();

        if files.len() <= MAX_TRASH {
            return;
        }

        files.sort_by_key(|e| {
            e.metadata()
                .and_then(|m| m.modified())
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
        });

        let to_remove = files.len() - MAX_TRASH;
        for entry in files.iter().take(to_remove) {
            let _ = fs::remove_file(entry.path());
        }
    }
}
