const transporter = require("../../config/nodemailer") 
const sendMailFunc = ({ to, subject, html }) => {
  return new Promise((resolve, reject) => {
    if (!(to && subject && html)) {
      return reject({
        isSend: false,
        error: `(to: ${to}), (subject: ${subject}) and (html: ${html}) is required!`,
      });
    }
    const data = {
      from: process.env.EMAIL,
      to: Array.isArray(to) ? to.join(", ") : to,     
      subject,
      html,
    };
    console.log("data", {
      from: process.env.EMAIL,
      to,
      subject,
      html,
    });
    transporter.sendMail(data, (error) => {
      if (error) {
        reject({
          isSend: false,
          error,
        });
      } else {
        resolve({
          isSend: true,
          data,
        });
      }
    });
  });
};

module.exports = {
  sendMailFunc,
};