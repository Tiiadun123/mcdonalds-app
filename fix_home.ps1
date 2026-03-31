$file = 'src\pages\Home.jsx'
$content = Get-Content $file -Raw -Encoding UTF8
$content = $content -replace 'Táº¡i sao.', 'T?i sao'
$content = $content -replace 'ChÃºng tÃ´i', 'Chúng tôi'
# Basically since powershell messed it up, maybe I just replace by string from a clean file?
