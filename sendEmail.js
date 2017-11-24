"use strict";
const nodemailer = require("nodemailer");
const PASS = require("./passwords.json");

// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing
module.exports = {
  sendNotification: function() {
    nodemailer.createTestAccount((err, account) => {
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: "smtp.udag.de",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: PASS.emailUser, // generated ethereal user
          pass: PASS.emailPassword // generated ethereal password
        }
      });

      // setup email data with unicode symbols
      let mailOptions = {
        from: '"Drawing Machine 🤖" <max@koehler-kn.de>', // sender address
        to: "hi@maxkoehler.com", // list of receivers
        subject: "Drawing ready ✔", // Subject line
        text: "Dude your drawing is finished." // plain text body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log("Message sent: %s", info.messageId);
      });
    });
  }
};
