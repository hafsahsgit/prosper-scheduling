$url = "https://vaglvmzknswfrjgnrcce.supabase.co/rest/v1"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZ2x2bXprbnN3ZnJqZ25yY2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjk2NjEsImV4cCI6MjEwNjg0NTY2MX0.yxpR4hxppfLeJej5Y-XD5vnvt1trPfUM7-Kt3uAj6J4"
$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
}

$rem = Invoke-RestMethod -Uri "$url/reschedules?select=*" -Headers $headers -Method Get
Write-Host "Remaining reschedules in Supabase: $($rem.Count)"
$rem | Format-Table id, student_name, days, time, original_slot, teacher, status

