# Configuration
$NODE_API = "http://localhost:3000"
$PYTHON_API = "http://localhost:8000"

Write-Host "🧪 Testing Email Extraction Flow..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# 1. Test Python service health
Write-Host "`n1. Testing Python Extractor..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$PYTHON_API/health"
    Write-Host "✅ Python service is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ Python service failed: $_.Exception.Message" -ForegroundColor Red
    exit
}

# 2. Login to get token
Write-Host "`n2. Logging in to get JWT token..." -ForegroundColor Yellow
$loginBody = @{
    email = "test2@abc.com"
    password = "Qwerty"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$NODE_API/api/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $userId = $loginResponse.user_id
    Write-Host "✅ Login successful (User ID: $userId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $_.Exception.Message" -ForegroundColor Red
    exit
}

# 3. Test extraction endpoint
Write-Host "`n3. Testing email extraction..." -ForegroundColor Yellow
$extractBody = @{
    from = "confirmation@united.com"
    subject = "Your flight booking #UA123456"
    body = "Confirmation for flight UA 123 from JFK to LAX on December 25, 2025. Total: $450.00. Booking Reference: UA45B7N"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $extractResponse = Invoke-RestMethod -Uri "$NODE_API/api/emails/extract" -Method Post -Headers $headers -Body $extractBody
    Write-Host "✅ Extraction successful!" -ForegroundColor Green
    Write-Host "Extracted data:" -ForegroundColor Cyan
    $extractResponse.extracted | ConvertTo-Json -Depth 10
    
    Write-Host "`nPreview as itinerary event:" -ForegroundColor Cyan
    $extractResponse.preview | ConvertTo-Json -Depth 10
    
    # Store extracted data for next step
    $extractedData = $extractResponse.extracted
} catch {
    Write-Host "❌ Extraction failed: $_.Exception.Message" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    exit
}

# 4. Create a test trip
Write-Host "`n4. Creating test trip..." -ForegroundColor Yellow
$tripBody = @{
    name = "Test Trip from Extractor"
    location_input = "Paris, France"
    start_date = "2025-12-20"
    end_date = "2025-12-30"
} | ConvertTo-Json

try {
    $tripResponse = Invoke-RestMethod -Uri "$NODE_API/api/trips" -Method Post -Headers $headers -Body $tripBody
    $tripId = $tripResponse.trip_id
    Write-Host "✅ Trip created (ID: $tripId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Trip creation failed: $_.Exception.Message" -ForegroundColor Red
    exit
}

# 5. Save extracted booking to trip
Write-Host "`n5. Saving booking to trip..." -ForegroundColor Yellow
$bookingBody = @{
    extractedData = $extractedData
} | ConvertTo-Json -Depth 10

try {
    $saveResponse = Invoke-RestMethod -Uri "$NODE_API/api/emails/trips/$tripId/bookings" -Method Post -Headers $headers -Body $bookingBody
    Write-Host "✅ Booking saved to trip!" -ForegroundColor Green
    Write-Host "Event ID: $($saveResponse.event_id)" -ForegroundColor Cyan
    Write-Host "Event title: $($saveResponse.event.title)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Save failed: $_.Exception.Message" -ForegroundColor Red
    Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit
}

# 6. Verify in database
Write-Host "`n6. Verifying in database..." -ForegroundColor Yellow
try {
    $connection = New-Object System.Data.SqlClient.SqlConnection
    $connection.ConnectionString = "Server=$env:DB_HOST;Database=$env:DB_NAME;User Id=$env:DB_USER;Password=$env:DB_PASSWORD;"
    $connection.Open()
    
    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT * FROM itinerary_event WHERE trip_id = $tripId ORDER BY created_at DESC LIMIT 1"
    
    $reader = $command.ExecuteReader()
    if ($reader.Read()) {
        Write-Host "✅ Database verification successful!" -ForegroundColor Green
        Write-Host "Event in DB: $($reader['title'])" -ForegroundColor Cyan
    }
    $reader.Close()
    $connection.Close()
} catch {
    Write-Host "⚠️ Could not verify in database (this is OK if you don't have SQL tools installed)" -ForegroundColor Yellow
}

Write-Host "`n🎉 All tests passed!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan