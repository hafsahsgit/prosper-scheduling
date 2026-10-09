$gasUrl = "https://script.google.com/macros/s/AKfycbzdzKAGkrCKrQA2432FdX0LTFGy8eSh84wdwUJ5iOAovw7X5cd0UmPFjDWCsbl-Cb9b/exec"

try {
    $resp = Invoke-RestMethod -Uri $gasUrl -Method Get
    Write-Host "GAS GET Response:"
    $resp | ConvertTo-Json -Depth 5
} catch {
    Write-Host "GAS GET error: $_"
}
