!macro NSIS_HOOK_POSTINSTALL
  CreateShortCut "$DESKTOP\Mochi Start-Stop.lnk" "$INSTDIR\mochi-desktop.exe" "--toggle" "$INSTDIR\mochi-desktop.exe" 0
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Delete "$DESKTOP\Mochi Start-Stop.lnk"
!macroend
