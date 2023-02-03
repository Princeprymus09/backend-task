const http = require("http");
const nStatic = require("node-static");
const { google } = require("googleapis");
require("dotenv").config({
  path: __dirname + "/.env",
});

// extracting environment variables
const { PORT = 3000, CLIENT_ID, CLIENT_SECRET, REDIRECT_URL } = process.env;

const fileServer = new nStatic.Server("./public");
const scope = [
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

// google oauth client
const oAuthClient = new google.auth.OAuth2({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URL,
});

let refresh_token;

// convert string like this first_name=Prince&last_name=Saini
// to {first_name:"Prince",last_name="Saini"}
function parseUrlParameter(paramString = "") {
  const result = {};
  const parameters = decodeURIComponent(paramString).split("&");
  parameters.map(function (item) {
    const [key, value] = item.split("=");
    result[key] = value;
  });

  return result;
}

// Setting up a basic server
http
  .createServer(async function (req, res) {
    // breaking url like this: /rest/v1/calendar/redirect?code=some-random-code -> /rest/v1/calendar/redirect and code=some-random-code
    const [url, parameterString] = req.url.split("?");

    if (url === "/rest/v1/calendar/init") {
      try {
        const url = oAuthClient.generateAuthUrl({
          access_type: "offline",
          scope: scope,
          prompt: "consent",
        });

        res.writeHead(301, { Location: url });
        res.end();
      } catch (err) {}
    } else if (url === "/rest/v1/calendar/redirect") {
      try {
        const params = parseUrlParameter(parameterString);
        if (!params.code) {
          throw new Error("no auth code supplied");
        }
        const { tokens } = await oAuthClient.getToken(params.code);
        oAuthClient.setCredentials(tokens);

        refresh_token = tokens.refresh_token;
        res.end("<script>window.close();</script>");
      } catch (error) {}
      res.end();
    } else if (url === "/rest/v1/calendar/events") {
      if (!refresh_token) throw new Error("Start oauth process first");
      try {
        oAuthClient.setCredentials({
          refresh_token,
        });
        const calendarResponse = await google
          .calendar({ version: "v3", auth: oAuthClient })
          .calendarList.list();
        const primaryCalendar = (calendarResponse.data.items ?? []).find(
          function (item) {
            return item.primary;
          }
        );
        const events = await google
          .calendar({ version: "v3", auth: oAuthClient })
          .events.list({ calendarId: primaryCalendar.id });
        res.end(JSON.stringify(events));
      } catch (error) {
        res.writeHead(400, error);
        res.end();
      }
    } else {
      fileServer.serveFile("/index.html", 200, {}, req, res);
    }
  })
  .listen(PORT, function () {
    console.log(`server start at port ${PORT}`); //the server object listens on port 3000
  });
