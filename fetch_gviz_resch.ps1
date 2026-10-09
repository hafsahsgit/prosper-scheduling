$spreadsheetId = "1TfKJieoXpdeua4u15csOq-gXuyuFy5pCyqFREDVO9BY"
$gid = "1808500887"
$url = "https://docs.google.com/spreadsheets/d/$spreadsheetId/gviz/tq?tqx=out:json&gid=$gid"

$res = Invoke-RestMethod -Uri $url -Method Get
$match = [regex]::Match($res, 'google\.visualization\.Query\.setResponse\((.*)\);')
if ($match.Success) {
    $json = $match.Groups[1].Value | ConvertFrom-Json
    $rows = $json.table.rows
    Write-Host "Google Sheet Rescheduled rows count: $($rows.Count)"
    foreach ($r in $rows) {
        $c = $r.c
        $vals = $c | ForEach-Object { if ($_) { $_.v } else { "" } }
        Write-Host "Row: $($vals -join ' | ')"
    }
} else {
    Write-Host "Failed to match GViz JSON"
}
