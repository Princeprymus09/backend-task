Add a .env file in the directory with following content


    PORT=3000
    REDIRECT_URL=http://localhost:3000/rest/v1/calendar/redirect
    CLIENT_ID=your-client-id
    CLIENT_SECRET=your-client-secret


To start this project run following command inside terminal


    npm i
    npm run start


once server start head over to browser and type http://localhost:3000

2 button will appear click the:-

- `Start Oauth` button and complete oauth process
- then click `Get Event` button to fetch events from your primary calendar
