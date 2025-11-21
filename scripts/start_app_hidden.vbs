' Ogrenci Takip Sistemi - Gizli Console
' Bu script backend'i arka planda baslatir (console gorunmez)

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Script'in bulundugu klasor
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
backendPath = scriptPath & "\backend"

' Backend'i arka planda calistir (console gizli)
WshShell.Run "cmd /c cd /d """ & backendPath & """ && python server.py", 0, False

' Bilgilendirme mesaji (opsiyonel)
MsgBox "Ogrenci Takip Sistemi baslatildi!" & vbCrLf & vbCrLf & _
       "Tarayicinizda http://127.0.0.1:8000 adresini acin" & vbCrLf & vbCrLf & _
       "Durdurmak icin Task Manager'dan python.exe'yi sonlandirin", _
       vbInformation, "Ogrenci Takip"

Set WshShell = Nothing
Set fso = Nothing
