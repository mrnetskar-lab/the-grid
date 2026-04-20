Run `move_to_archive.ps1` to move all top-level files and folders into an `archive/` directory (excludes `.git`).

Commands:

```powershell
# from repo root
pwsh ./scripts/move_to_archive.ps1
# or with a custom archive name
pwsh ./scripts/move_to_archive.ps1 -ArchiveName archive-2026-04-20
```

Note: This script performs a physical move. Review the `archive/` folder after running. If you want me to perform the move here, grant a token or run the script locally and tell me when it's done and I can commit the result.