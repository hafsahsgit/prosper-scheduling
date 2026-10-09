$url = "https://vaglvmzknswfrjgnrcce.supabase.co/rest/v1"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZ2x2bXprbnN3ZnJqZ25yY2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjk2NjEsImV4cCI6MjEwNjg0NTY2MX0.yxpR4hxppfLeJej5Y-XD5vnvt1trPfUM7-Kt3uAj6J4"
$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
}

$students = Invoke-RestMethod -Uri "$url/students?select=*" -Headers $headers -Method Get
Write-Host "Total students in Supabase: $($students.Count)"
$fri = $students | Where-Object { $_.days -like '*Fri*' -or $_.days -like '*Friday*' }
Write-Host "Friday students in Supabase: $($fri.Count)"
$fri | Format-Table id, child_name, days, time, status, teacher
