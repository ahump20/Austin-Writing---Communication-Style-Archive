#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$repo_root/X-Twitter-Archive/source"
out_dir="$repo_root/X-Twitter-Archive/processed"
analysis_dir="$repo_root/X-Twitter-Archive/official-analysis/2026-07-06"

mkdir -p "$source_dir" "$out_dir"

archives=()
while IFS= read -r -d '' archive; do
  archives+=("$archive")
done < <(find "$source_dir" -maxdepth 1 -type f -iname '*.zip' -print0)

if [[ "${#archives[@]}" -eq 0 ]]; then
  cat <<EOF
[open] No official X archive ZIPs found.

Drop the downloaded archive ZIPs here:
  $source_dir

Then rerun:
  ./scripts/run_official_x_archive_pipeline.sh
EOF
  exit 2
fi

python3 "$repo_root/scripts/parse_x_archive.py" "${archives[@]}" --out "$out_dir"
python3 "$repo_root/scripts/build_x_voice_artifact.py" --processed "$out_dir" --out "$analysis_dir"

cat <<EOF

[verified] Official archive parsing and analysis build finished.
Output:
  $out_dir
  $analysis_dir
EOF
