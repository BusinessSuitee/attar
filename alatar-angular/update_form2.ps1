$htmlPath = 'd:\Projects\attar\alatar-angular\src\app\pages\admin-dashboard\admin-dashboard.page.html'
$fileContent = Get-Content $htmlPath -Raw
$start = $fileContent.IndexOf('<section class="products-grid"')
$end = $fileContent.IndexOf('</section>', $start) + 10

$newHtml = Get-Content "$env:TEMP\grid_new.txt" -Raw
$newCss = Get-Content "$env:TEMP\grid_css.txt" -Raw

$newContent = $fileContent.Substring(0, $start) + $newHtml + "`n" + $fileContent.Substring($end)
Set-Content -Path $htmlPath -Value $newContent -Encoding UTF8

$cssPath = 'd:\Projects\attar\alatar-angular\src\app\pages\admin-dashboard\admin-dashboard.page.css'
Add-Content -Path $cssPath -Value "`n$newCss" -Encoding UTF8

Write-Host "Replaced!"
