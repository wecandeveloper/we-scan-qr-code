 const otpMailTemplate = (otp) => `
    <html>
        <head>
        <style>
            body {
                display: flex;
                flex-direction: column;
                gap: 30px;
            }

            .text {
                width: fit-content;
                margin: auto;
            }

            .otp {
                color: rgb(0, 120, 256);
                width: fit-content;
            }
        </style>
        </head>
        <body>
            <h4>
                The OTP for Chrunchies signup is:
            </h4>
            <h1 class="otp">
                ${otp}
            </h1>
            <p>
                Please don't share this OTP with anyone at any cost.
            </p>
        </body>
    </html>
`;

module.exports = {
    otpMailTemplate
};


