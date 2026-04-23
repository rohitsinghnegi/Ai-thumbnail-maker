Start-Process powershell -ArgumentList "-NoExit -Command cd backend; node server.js"
Start-Process powershell -ArgumentList "-NoExit -Command cd frontend; npm run dev"
