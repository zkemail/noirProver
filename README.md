# noirProver

Minimal server side noir prover

# Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Gmail OAuth Configuration
# Get these credentials from Google Cloud Console: https://console.cloud.google.com/
# 1. Create a new project or select existing one
# 2. Enable Gmail API
# 3. Create OAuth 2.0 credentials (Web application)
# 4. Add authorized redirect URI: http://localhost:3000/gmail/callback (or your production URL)

GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/gmail/callback
```

# Running using docker

make sure you have docker installed

```
docker-compose up --build
```

This will run the server on localhost:3000

# API Endpoints

## POST /prove

Generate a proof for an email. This is the main proving endpoint.

try it out using this sample request:

```
 {
  "rawEmail": "Delivered-To: snparvizi75@gmail.com\r\nReceived: by 2002:a05:6236:7312:b0:1b2:dde6:e37d with SMTP id g18csp2105107ggc;\r\n        Fri, 14 Nov 2025 16:20:38 -0800 (PST)\r\nX-Google-Smtp-Source: AGHT+IFPcJUWIf4pQC+Cziyscown0i0ktBUHAaUQBlR8T+C1PXUG4xBjd9blhxgVNtCSzOKwRHyU\r\nX-Received: by 2002:a05:622a:1a28:b0:4ed:181c:297b with SMTP id d75a77b69052e-4edf2066e7bmr75620431cf.8.1763166038783;\r\n        Fri, 14 Nov 2025 16:20:38 -0800 (PST)\r\nARC-Seal: i=1; a=rsa-sha256; t=1763166038; cv=none;\r\n        d=google.com; s=arc-20240605;\r\n        b=eSJLlQku+5cFJ0dKL9E5R4A7KXyeAUwpOXU2tkFN/3Tb2vFh39oocQsIIaGP+ATysn\r\n         vRhDAUM7x5FY7z3u6FcweAPJ3uYA3b/ctGpfI+/iJ/D1Rrklrovb1FoMIys7dZE+soyJ\r\n         oXcUuGha0GmtSj9qagv2SUhK6DyH7EHJwAZbVk6lwaYlVnjlDseDs9CMDzWDhFavCGp5\r\n         i4gF2SLUmelSAW5+WYiwxrOvlkcfpM6+mcG4cHMMHoLnZa0YkVLC8bnvg5jK6zChsY25\r\n         oA0epp5KmQkmiKayXHnaGReP1mlhJtlzd+N2QuWqXB8HmPrzy62kXCSA5uhAGo8SKU7Q\r\n         8yag==\r\nARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605;\r\n        h=to:subject:message-id:mime-version:from:date:dkim-signature\r\n         :dkim-signature;\r\n        bh=3C8A+1m2iwIKXPYuYLhllNSzVCZSc1zjL9Ka7J0oGr0=;\r\n        fh=9SOnRXPrOrgNHa7S9QD5/AvW4oZpoukq3zjg3rYJMmQ=;\r\n        b=eQMLu9fTwy6DeXcYufYOBjIbko0sEDCgQ5SzJ/Rs800rZqmox6DXaZr6M5xscRx/3Z\r\n         Gp/uw++47AaSHNk9I5/VcrNb64Npd+ncNkMupswLXtF2mGkl7vBul6E2VVS9svtvX32x\r\n         ghthstz3PhW1DbuO/EYI67ZBKXfO+9gDFUq6/T7BbOxHU+UoaxxhspU/bIeOD0EGYe2w\r\n         BO3n6YfIgpPdJfq2cNYgy9TI3pqG99DstPLa7p0+RftZQJmljL5CtLiqyeRHhHkDJI4L\r\n         KJ51OBWI0vC3HOlQ3yEUHjOgdTo/YY8xHdPCFV2vU7is+hTs4DAVoX6s6i+KeGyeCQIB\r\n         m6Ww==;\r\n        dara=google.com\r\nARC-Authentication-Results: i=1; mx.google.com;\r\n       dkim=pass header.i=@discord.com header.s=s1 header.b=gsm1wL1e;\r\n       dkim=pass header.i=@sendgrid.info header.s=smtpapi header.b=ec9lAcCh;\r\n       spf=pass (google.com: domain of bounces+12551241-f57c-snparvizi75=gmail.com@mail.discord.com designates 192.254.120.211 as permitted sender) smtp.mailfrom=\"bounces+12551241-f57c-snparvizi75=gmail.com@mail.discord.com\";\r\n       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=discord.com\r\nReturn-Path: <bounces+12551241-f57c-snparvizi75=gmail.com@mail.discord.com>\r\nReceived: from o17.ptr8588.discord.com (o17.ptr8588.discord.com. [192.254.120.211])\r\n        by mx.google.com with ESMTPS id d75a77b69052e-4ede897daffsi24186971cf.1362.2025.11.14.16.20.38\r\n        for <snparvizi75@gmail.com>\r\n        (version=TLS1_3 cipher=TLS_AES_128_GCM_SHA256 bits=128/128);\r\n        Fri, 14 Nov 2025 16:20:38 -0800 (PST)\r\nReceived-SPF: pass (google.com: domain of bounces+12551241-f57c-snparvizi75=gmail.com@mail.discord.com designates 192.254.120.211 as permitted sender) client-ip=192.254.120.211;\r\nAuthentication-Results: mx.google.com;\r\n       dkim=pass header.i=@discord.com header.s=s1 header.b=gsm1wL1e;\r\n       dkim=pass header.i=@sendgrid.info header.s=smtpapi header.b=ec9lAcCh;\r\n       spf=pass (google.com: domain of bounces+12551241-f57c-snparvizi75=gmail.com@mail.discord.com designates 192.254.120.211 as permitted sender) smtp.mailfrom=\"bounces+12551241-f57c-snparvizi75=gmail.com@mail.discord.com\";\r\n       dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=discord.com\r\nDKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=discord.com;\r\n\th=content-type:date:from:mime-version:subject:to:cc:content-type:date:\r\n\tfeedback-id:from:subject:to;\r\n\ts=s1; bh=3C8A+1m2iwIKXPYuYLhllNSzVCZSc1zjL9Ka7J0oGr0=;\r\n\tb=gsm1wL1eWXlJX6yuwzmDWHW8bXPdMGHiUcMS5VWq69vM3u55GFTl2BU3mhQetxA1S9YI\r\n\tiQGWkCQkOipTwthBafCQlpMMutj1ftMR+rF5ZVlZ7snpHs/fzx8FTziY4FlejHCMJVpeKw\r\n\tYCFjRl+pFu1jW17ppqyQVtd2uR0kwAK9rEE0i4UrcJ6ywkWX2mzJyVoQrRyduFGkmjrHxv\r\n\tHK8sK1j0yj/rvR05RrEfTypiYDptB7S+RLaqv4vlPUwiyeM7QGz4DQPlB9xhjkQ31Mxtk2\r\n\tf9Fie6KpHty31gE7ZkLXunoMJpl+hYN3ssNC9CIC7ZSwQ3C6dVfgW4OKc0vEftag==\r\nDKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=sendgrid.info;\r\n\th=content-type:date:from:mime-version:subject:to:cc:content-type:date:\r\n\tfeedback-id:from:subject:to;\r\n\ts=smtpapi; bh=3C8A+1m2iwIKXPYuYLhllNSzVCZSc1zjL9Ka7J0oGr0=;\r\n\tb=ec9lAcChVH/Gxk7W1KRXrOLlo3l7J/Rcv+K/0I/QJNXFM3+D793sIqWf73vCDl6nhvzm\r\n\tWvfGURJlK4HGEi1RhbBNZABck53mXXlewLTOLKCXDdZp01PUUh4QHzuQsQ8UYDC9TRUJek\r\n\tKj478LEjfsBCeCJ8V1zFoBZ2XJ/gEp7Ag=\r\nReceived: by recvd-67b448fdcd-6p6mt with SMTP id recvd-67b448fdcd-6p6mt-1-6917C755-8\r\n\t2025-11-15 00:20:37.143734303 +0000 UTC m=+14110571.293804958\r\nReceived: from MTI1NTEyNDE (unknown)\r\n\tby geopod-ismtpd-35 (SG) with HTTP\r\n\tid fc0hogvBQpGpxdj90_IRsg\r\n\tSat, 15 Nov 2025 00:20:37.138 +0000 (UTC)\r\nContent-Type: multipart/alternative; boundary=94a7c3da60abb8b82937ca812fbb914352acfe2b1e5a3156b4eb0077b87a\r\nDate: Sat, 15 Nov 2025 00:20:37 +0000 (UTC)\r\nFrom: Discord <noreply@discord.com>\r\nMime-Version: 1.0\r\nMessage-ID: <fc0hogvBQpGpxdj90_IRsg@geopod-ismtpd-35>\r\nSubject: Password Reset Request for Discord\r\nX-SG-EID: \r\n =?us-ascii?Q?u001=2Encph=2Fx3Jw0NdHDwq6twCdiOEjRqduaW+3S=2FWXBRXzv62NXoGt1LlW8ZOp?=\r\n =?us-ascii?Q?GajFHOckwXgf=2FSakY5ppy6FU7ve8fkMS7UdE=2Fy2?=\r\n =?us-ascii?Q?FX0cxmLLSXPUfjLC=2FNCqa8eASuJihJrfTGxA2bh?=\r\n =?us-ascii?Q?acDwXcPidudsLbPLl1ASTUMZYdiViRROrd5z842?=\r\n =?us-ascii?Q?Nry5wFQJxLSWJPnt2vguUhlihZGQMmPv=2Fzk0Y8W?=\r\n =?us-ascii?Q?zmuEJ+SuDE9WFaDhqJBnWg=3D?=\r\nX-SG-ID: \r\n =?us-ascii?Q?u001=2ESdBcvi+Evd=2FbQef8eZF3BhO179ajqOn=2FByy3ZFTqK+3FtqKfJQbGQ46ky?=\r\n =?us-ascii?Q?dQ=2FOEmSPqRpyu5rkq1YxpEyEJ9NQPHPOOxNPXvL?=\r\n =?us-ascii?Q?myBJcrTgCkI=3D?=\r\nTo: snparvizi75@gmail.com\r\nX-Entity-ID: u001./CsYf4h0MhpT6Wn4uiuimw==\r\n\r\n--94a7c3da60abb8b82937ca812fbb914352acfe2b1e5a3156b4eb0077b87a\r\nContent-Transfer-Encoding: quoted-printable\r\nContent-Type: text/plain; charset=us-ascii\r\nMime-Version: 1.0\r\n\r\n Hey zkfriendly,\r\n\r\nYour Discord password can be reset by clicking the button below. If you did=\r\n not request a new password, please ignore this email.\r\n\r\nReset Password: https://click.discord.com/ls/click?upn=3Du001.a0NJ38DJJG1su=\r\nlNx5wS1jjC3-2FytEgbSbq-2FUmpxbpkbg14puiUN75BQU-2BrfLFYuAWFopFRw2u4OXGnhLHFL=\r\n-2FupdZ6fPN7j14EG7ILzx6-2B1xTy5m-2BAqdNLA5cYfjloAWJa5RrmFUYicl1WMwtICf4RqwA=\r\nx4PSgTP1OySS2KrtJ6Uvrlm1Bs7aqRwNv7USzbCeMwykyDjl7WvH3rj7dohVqCQ-3D-3DsPil_3=\r\nREPWe-2FF-2F9ZAj6tQH1B1ChpRNdgCzd4zgT6CuME-2B6XzS4Aq7CdwMg2FLL2DZTNv7ODrY0M=\r\nbM7-2BDHBG2aD5j4IOGrxWK9q7KJwPZve61OkyGeTRzMmdfU5E9u-2FwUhENwiPHGz1-2FzZvms=\r\n-2BKcxp8xd5XF3EtuOIipN-2FiH99zponk8t37Bp0WD2HD7yzIlQ6p8puhPMR-2Fgj5WSyfpnFr=\r\nLuyj613BCVKDn8SJjvva7kJmb0vjNmjRQGKVoRVPMLTDuhbqYT-2BXnnP9tGo4s1T8TFev0w-3D=\r\n-3D\r\n\r\n\r\n--94a7c3da60abb8b82937ca812fbb914352acfe2b1e5a3156b4eb0077b87a\r\nContent-Transfer-Encoding: quoted-printable\r\nContent-Type: text/html; charset=utf-8\r\nMime-Version: 1.0\r\n\r\n<!doctype html>\r\n<html xmlns=3D\"http://www.w3.org/1999/xhtml\" xmlns:v=3D\"urn:schemas-microso=\r\nft-com:vml\" xmlns:o=3D\"urn:schemas-microsoft-com:office:office\">\r\n<head>\r\n  <title></title>\r\n  <!--[if !mso]><!-- -->\r\n  <meta http-equiv=3D\"X-UA-Compatible\" content=3D\"IE=3Dedge\">\r\n  <!--<![endif]-->\r\n<meta http-equiv=3D\"Content-Type\" content=3D\"text/html; charset=3DUTF-8\">\r\n<style type=3D\"text/css\">\r\n  #outlook a { padding: 0; }\r\n  .ReadMsgBody { width: 100%; }\r\n  .ExternalClass { width: 100%; }\r\n  .ExternalClass * { line-height:100%; }\r\n  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-si=\r\nze-adjust: 100%; }\r\n  table, td { border-collapse:collapse; mso-table-lspace: 0pt; mso-table-rs=\r\npace: 0pt; }\r\n  img { border: 0; height: auto; line-height: 100%; outline: none; text-dec=\r\noration: none; -ms-interpolation-mode: bicubic; }\r\n  p { display: block; margin: 13px 0; }\r\n</style>\r\n<!--[if !mso]><!-->\r\n<style type=3D\"text/css\">\r\n  @media only screen and (max-width:480px) {\r\n    @-ms-viewport { width:320px; }\r\n    @viewport { width:320px; }\r\n  }\r\n</style>\r\n<!--<![endif]-->\r\n<!--[if mso]>\r\n<xml>\r\n  <o:OfficeDocumentSettings>\r\n    <o:AllowPNG/>\r\n    <o:PixelsPerInch>96</o:PixelsPerInch>\r\n  </o:OfficeDocumentSettings>\r\n</xml>\r\n<![endif]-->\r\n<!--[if lte mso 11]>\r\n<style type=3D\"text/css\">\r\n  .outlook-group-fix {\r\n    width:100% !important;\r\n  }\r\n</style>\r\n<![endif]-->\r\n\r\n<!--[if !mso]><!-->\r\n    <link href=3D\"https://fonts.googleapis.com/css?family=3DUbuntu:300,400,=\r\n500,700\" rel=3D\"stylesheet\" type=3D\"text/css\">\r\n    <style type=3D\"text/css\">\r\n\r\n        @import url(https://fonts.googleapis.com/css?family=3DUbuntu:300,40=\r\n0,500,700);\r\n\r\n    </style>\r\n  <!--<![endif]--><style type=3D\"text/css\">\r\n  @media only screen and (min-width:480px) {\r\n    .mj-column-per-100, * [aria-labelledby=3D\"mj-column-per-100\"] { width:1=\r\n00%!important; }\r\n  }\r\n</style>\r\n</head>\r\n<body style=3D\"background: #F9F9F9;\">\r\n  <div style=3D\"background-color:#F9F9F9;\"><!--[if mso | IE]>\r\n      <table role=3D\"presentation\" border=3D\"0\" cellpadding=3D\"0\" cellspaci=\r\nng=3D\"0\" width=3D\"640\" align=3D\"center\" style=3D\"width:640px;\">\r\n        <tr>\r\n          <td style=3D\"line-height:0px;font-size:0px;mso-line-height-rule:e=\r\nxactly;\">\r\n      <![endif]-->\r\n  <style type=3D\"text/css\">\r\n    html, body, * {\r\n      -webkit-text-size-adjust: none;\r\n      text-size-adjust: none;\r\n    }\r\n    a {\r\n      color:#1EB0F4;\r\n      text-decoration:none;\r\n    }\r\n    a:hover {\r\n      text-decoration:underline;\r\n    }\r\n  </style>\r\n<div style=3D\"margin:0px auto;max-width:640px;background:transparent;\"><tab=\r\nle role=3D\"presentation\" cellpadding=3D\"0\" cellspacing=3D\"0\" style=3D\"font-=\r\nsize:0px;width:100%;background:transparent;\" align=3D\"center\" border=3D\"0\">=\r\n<tbody><tr><td style=3D\"text-align:center;vertical-align:top;direction:ltr;=\r\nfont-size:0px;padding:40px 0px;\"><!--[if mso | IE]>\r\n      <table role=3D\"presentation\" border=3D\"0\" cellpadding=3D\"0\" cellspaci=\r\nng=3D\"0\"><tr><td style=3D\"vertical-align:top;width:640px;\">\r\n      <![endif]--><div aria-labelledby=3D\"mj-column-per-100\" class=3D\"mj-co=\r\nlumn-per-100 outlook-group-fix\" style=3D\"vertical-align:top;display:inline-=\r\nblock;direction:ltr;font-size:13px;text-align:left;width:100%;\"><table role=\r\n=3D\"presentation\" cellpadding=3D\"0\" cellspacing=3D\"0\" width=3D\"100%\" border=\r\n=3D\"0\"><tbody><tr><td style=3D\"word-break:break-word;font-size:0px;padding:=\r\n0px;\" align=3D\"center\"><table role=3D\"presentation\" cellpadding=3D\"0\" cells=\r\npacing=3D\"0\" style=3D\"border-collapse:collapse;border-spacing:0px;\" align=\r\n=3D\"center\" border=3D\"0\"><tbody><tr><td style=3D\"width:138px;\"><a href=3D\"h=\r\nttps://click.discord.com/ls/click?upn=3Du001.a0NJ38DJJG1sulNx5wS1jvdSQ2XvqH=\r\nIrLV9yv-2FClqGMsQ561nXpQGbTcquM2dU3Xx1_h_3REPWe-2FF-2F9ZAj6tQH1B1ChpRNdgCzd=\r\n4zgT6CuME-2B6XzS4Aq7CdwMg2FLL2DZTNv7D0eAOGVtpNfX0-2FLyebGOAnjwkAmWEPBipz62o=\r\ngozn0EKW9uugGtAjGXzLHfQloxSF4azc8U7az7tmip27hM7v2X-2B4zBC4H8I3dKJLE-2BQuCEp=\r\nj77FFa6aDEQ6JBrDFqvmLDStML-2FIQ71Y-2FhxVSsXE7hepvjI-2FUnQVI8VpKlb2SVb9DIHKc=\r\njc3zPv8vxTEEKuXF2NF2ee9lN4hVk7RHH4uOw-3D-3D\" target=3D\"_blank\"><img alt tit=\r\nle height=3D\"38px\" src=3D\"https://cdn.discordapp.com/email_assets/592423b8a=\r\nedd155170617c9ae736e6e7.png\" style=3D\"border:none;border-radius:;display:bl=\r\nock;outline:none;text-decoration:none;width:100%;height:38px;\" width=3D\"138=\r\n\"></a></td></tr></tbody></table></td></tr></tbody></table></div><!--[if mso=\r\n | IE]>\r\n      </td></tr></table>\r\n      <![endif]--></td></tr></tbody></table></div><!--[if mso | IE]>\r\n      </td></tr></table>\r\n      <![endif]-->\r\n      <!--[if mso | IE]>\r\n      <table role=3D\"presentation\" border=3D\"0\" cellpadding=3D\"0\" cellspaci=\r\nng=3D\"0\" width=3D\"640\" align=3D\"center\" style=3D\"width:640px;\">\r\n        <tr>\r\n          <td style=3D\"line-height:0px;font-size:0px;mso-line-height-rule:e=\r\nxactly;\">\r\n      <![endif]--><div style=3D\"max-width:640px;margin:0 auto;box-shadow:0p=\r\nx 1px 5px rgba(0,0,0,0.1);border-radius:4px;overflow:hidden\"><div style=3D\"=\r\nmargin:0px auto;max-width:640px;background:#ffffff;\"><table role=3D\"present=\r\nation\" cellpadding=3D\"0\" cellspacing=3D\"0\" style=3D\"font-size:0px;width:100=\r\n%;background:#ffffff;\" align=3D\"center\" border=3D\"0\"><tbody><tr><td style=\r\n=3D\"text-align:center;vertical-align:top;direction:ltr;font-size:0px;paddin=\r\ng:40px 50px;\"><!--[if mso | IE]>\r\n      <table role=3D\"presentation\" border=3D\"0\" cellpadding=3D\"0\" cellspaci=\r\nng=3D\"0\"><tr><td style=3D\"vertical-align:top;width:640px;\">\r\n      <![endif]--><div aria-labelledby=3D\"mj-column-per-100\" class=3D\"mj-co=\r\nlumn-per-100 outlook-group-fix\" style=3D\"vertical-align:top;display:inline-=\r\nblock;direction:ltr;font-size:13px;text-align:left;width:100%;\"><table role=\r\n=3D\"presentation\" cellpadding=3D\"0\" cellspacing=3D\"0\" width=3D\"100%\" border=\r\n=3D\"0\"><tbody><tr><td style=3D\"word-break:break-word;font-size:0px;padding:=\r\n0px;\" align=3D\"left\"><div style=3D\"cursor:auto;color:#737F8D;font-family:He=\r\nlvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif;font-size:16px;li=\r\nne-height:24px;text-align:left;\">\r\n           =20\r\n  <h2 style=3D\"font-family: Helvetica Neue, Helvetica, Arial, Lucida Grande=\r\n, sans-serif;font-weight: 500;font-size: 20px;color: #4F545C;letter-spacing=\r\n: 0.27px;\">Hey zkfriendly,</h2>\r\n<p>Your Discord password can be reset by clicking the button below. If you =\r\ndid not request a new password, please ignore this email.</p>\r\n\r\n          </div></td></tr><tr><td style=3D\"word-break:break-word;font-size:=\r\n0px;padding:10px 25px;padding-top:20px;\" align=3D\"center\"><table role=3D\"pr=\r\nesentation\" cellpadding=3D\"0\" cellspacing=3D\"0\" style=3D\"border-collapse:se=\r\nparate;\" align=3D\"center\" border=3D\"0\"><tbody><tr><td style=3D\"border:none;=\r\nborder-radius:3px;color:white;cursor:auto;padding:15px 19px;\" align=3D\"cent=\r\ner\" valign=3D\"middle\" bgcolor=3D\"#5865f2\"><a href=3D\"https://click.discord.=\r\ncom/ls/click?upn=3Du001.a0NJ38DJJG1sulNx5wS1jjC3-2FytEgbSbq-2FUmpxbpkbg14pu=\r\niUN75BQU-2BrfLFYuAWFopFRw2u4OXGnhLHFL-2FupdZ6fPN7j14EG7ILzx6-2B1xTy5m-2BAqd=\r\nNLA5cYfjloAWJa5RrmFUYicl1WMwtICf4RqwAx4PSgTP1OySS2KrtJ6Uvrlm1Bs7aqRwNv7USzb=\r\nCeMwykyDjl7WvH3rj7dohVqCQ-3D-3DHKMc_3REPWe-2FF-2F9ZAj6tQH1B1ChpRNdgCzd4zgT6=\r\nCuME-2B6XzS4Aq7CdwMg2FLL2DZTNv7HZHIzc5N1YoJksZdItmnnlabHXr1vk8hkXzbU3wt-2FG=\r\nX9td0-2BL4WCvO3qBbWxFjW6cK699d7mDvKlCrgCkvc2EBw1om0endFWrMwWB7Ic4xVS2s3-2Bk=\r\ngCtdZZgImf7p9T2p8hMslr-2Bygyn-2Bzz4FrIOdg-2B-2FK-2BWCvgtavisqoF-2FDsvlbE5yk=\r\nydT5WcDZdK6ze-2F5qJyaD8ccRjiomduEgNjxicw-3D-3D\" style=3D\"text-decoration:no=\r\nne;line-height:100%;background:#5865f2;color:white;font-family:Ubuntu, Helv=\r\netica, Arial, sans-serif;font-size:15px;font-weight:normal;text-transform:n=\r\none;margin:0px;\" target=3D\"_blank\">\r\n            Reset Password\r\n          </a></td></tr></tbody></table></td></tr><tr><td style=3D\"word-bre=\r\nak:break-word;font-size:0px;padding:30px 0px;\"><p style=3D\"font-size:1px;ma=\r\nrgin:0px auto;border-top:1px solid #DCDDDE;width:100%;\"></p><!--[if mso | I=\r\nE]><table role=3D\"presentation\" align=3D\"center\" border=3D\"0\" cellpadding=\r\n=3D\"0\" cellspacing=3D\"0\" style=3D\"font-size:1px;margin:0px auto;border-top:=\r\n1px solid #DCDDDE;width:100%;\" width=3D\"640\"><tr><td style=3D\"height:0;line=\r\n-height:0;\">=C2=A0</td></tr></table><![endif]--></td></tr><tr><td style=3D\"=\r\nword-break:break-word;font-size:0px;padding:0px;\" align=3D\"left\"><div style=\r\n=3D\"cursor:auto;color:#747F8D;font-family:Helvetica Neue, Helvetica, Arial,=\r\n Lucida Grande, sans-serif;font-size:13px;line-height:16px;text-align:left;=\r\n\">\r\n<p>Need help? <a href=3D\"https://click.discord.com/ls/click?upn=3Du001.a0NJ=\r\n38DJJG1sulNx5wS1jjzYylRfR1dTnRDiglN63M-2BMCClfzJfrsZtMYvRMSOpubXgqn3QOXIgl2=\r\nQki904cEg-3D-3Dd1uT_3REPWe-2FF-2F9ZAj6tQH1B1ChpRNdgCzd4zgT6CuME-2B6XzS4Aq7C=\r\ndwMg2FLL2DZTNv7o8sBSFeZsIcAl1ELlur4t3HgVcct-2BhtikTeyVPgYnkDc-2Ba-2BwkjgpwF=\r\nsMMYeVLePr1parCltT1PebO0LLnQGvo8kTL7ZZand4OSiYgP1FF4scbDYZlL0VOyUjOnHynaZ8w=\r\n5qzSsGX-2FTGN-2FQOudphwiPjZsBtnfxnHMTMYScFJsZTFaVWeuYqM3BavMSynSEHbYSm3f7Tx=\r\n650osNkP2SXmtQ-3D-3D\" style=3D\"font-family: Helvetica Neue, Helvetica, Aria=\r\nl, Lucida Grande, sans-serif;color: #5865f2;\">Contact our support team</a> =\r\nor hit us up on X <a href=3D\"https://click.discord.com/ls/click?upn=3Du001.=\r\na0NJ38DJJG1sulNx5wS1jj3tSd0wO7l0RMa-2Fg4oVt1Y-3DH18I_3REPWe-2FF-2F9ZAj6tQH1=\r\nB1ChpRNdgCzd4zgT6CuME-2B6XzS4Aq7CdwMg2FLL2DZTNv79r0dT208jABr6N0Wlu0bKZGeGPw=\r\nw8VC7ACcyRmWjGP1TNYZrsFojhHvuzjL4RErG0IRNUxgn0C2XgYHxmKYjitiFd-2Fe-2FFbe79w=\r\nPmAXJVcYLHaMQZdYpJxQTOD0VNAGmWHYrj-2F4-2BS6c9tml-2FTkXReutghoEDtmwmy5-2FkVc=\r\nx-2Bo2lQvZRl4EEVm6YBJMtmVsYUP3LmmbWyFoWD0dva6Lb1PTQ-3D-3D\" style=3D\"font-fa=\r\nmily: Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif;color: #5=\r\n865f2;\">@discord</a>.<br>\r\nWant to give us feedback? Let us know what you think on our <a href=3D\"http=\r\ns://click.discord.com/ls/click?upn=3Du001.a0NJ38DJJG1sulNx5wS1joI9Fqppk-2F0=\r\nJ2T5Y6xRzgVmFjYYBJG4huhnJGbyj2T7mBIWJ_3REPWe-2FF-2F9ZAj6tQH1B1ChpRNdgCzd4zg=\r\nT6CuME-2B6XzS4Aq7CdwMg2FLL2DZTNv7cfcl8Sfs5ht0cZiE4SkCO95m-2BWGzZJF8u1TXpp29=\r\nw4dFu5n5oPJBhgZC293uxzigY6NV2fX-2Fde1Enl8nTjE2VQFxid933lKyGUmQVAo9E1kVk-2Bu=\r\nTLsTBaMyywW2gBlOl5RduqAg-2FdqCfDCgpki2fV8KluuSVc3WukpXggmf93Ylh09e8JGbgs1d9=\r\naIQ18PBOybLl9F-2FaMK30oWoK29Imzw-3D-3D\" style=3D\"font-family: Helvetica Neu=\r\ne, Helvetica, Arial, Lucida Grande, sans-serif;color: #5865f2;\">feedback si=\r\nte</a>.</p>\r\n\r\n</div></td></tr></tbody></table></div><!--[if mso | IE]>\r\n      </td></tr></table>\r\n      <![endif]--></td></tr></tbody></table></div><!--[if mso | IE]>\r\n      </td></tr></table>\r\n      <![endif]-->\r\n      <!--[if mso | IE]>\r\n      <table role=3D\"presentation\" border=3D\"0\" cellpadding=3D\"0\" cellspaci=\r\nng=3D\"0\" width=3D\"640\" align=3D\"center\" style=3D\"width:640px;\">\r\n        <tr>\r\n          <td style=3D\"line-height:0px;font-size:0px;mso-line-height-rule:e=\r\nxactly;\">\r\n      <![endif]--></div><div style=3D\"margin:0px auto;max-width:640px;backg=\r\nround:transparent;\"><table role=3D\"presentation\" cellpadding=3D\"0\" cellspac=\r\ning=3D\"0\" style=3D\"font-size:0px;width:100%;background:transparent;\" align=\r\n=3D\"center\" border=3D\"0\"><tbody><tr><td style=3D\"text-align:center;vertical=\r\n-align:top;direction:ltr;font-size:0px;padding:20px 0px;\"><!--[if mso | IE]=\r\n>\r\n      <table role=3D\"presentation\" border=3D\"0\" cellpadding=3D\"0\" cellspaci=\r\nng=3D\"0\"><tr><td style=3D\"vertical-align:top;width:640px;\">\r\n      <![endif]--><div aria-labelledby=3D\"mj-column-per-100\" class=3D\"mj-co=\r\nlumn-per-100 outlook-group-fix\" style=3D\"vertical-align:top;display:inline-=\r\nblock;direction:ltr;font-size:13px;text-align:left;width:100%;\"><table role=\r\n=3D\"presentation\" cellpadding=3D\"0\" cellspacing=3D\"0\" width=3D\"100%\" border=\r\n=3D\"0\"><tbody><tr><td style=3D\"word-break:break-word;font-size:0px;padding:=\r\n0px;\" align=3D\"center\"><div style=3D\"cursor:auto;color:#99AAB5;font-family:=\r\nHelvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif;font-size:12px;=\r\nline-height:24px;text-align:center;\">\r\n      Sent by Discord =E2=80=A2\r\n      <a href=3D\"https://click.discord.com/ls/click?upn=3Du001.a0NJ38DJJG1s=\r\nulNx5wS1jg47LNijrYlxYHgEj-2F4b07UMFx-2FY1i3YU2fQrHXY43AC6TC1_3REPWe-2FF-2F9=\r\nZAj6tQH1B1ChpRNdgCzd4zgT6CuME-2B6XzS4Aq7CdwMg2FLL2DZTNv7LdisQgVkhXez44czxKG=\r\n5QziypDhkm9IEM9JviCjIEmecLumu2ajsN05piYgttPvWhPLX0KOm1vve9aAeUkcwMXalK9f7t3=\r\n6U5qmImAKbzMk-2Bn1gR6Ab3F6NumEOzbaZnkzfsVNUOm0G4uZ9G8k9Qrc0DwVyLcNT5sLl718D=\r\nese2qY7s5-2FpHGsrDHQ3QD7cObE3G4PQcM335EZAdRaBsweA-3D-3D\" style=3D\"color:#1E=\r\nB0F4;text-decoration:none;\">Check Our Blog</a>\r\n      =E2=80=A2 <a href=3D\"https://click.discord.com/ls/click?upn=3Du001.a0=\r\nNJ38DJJG1sulNx5wS1jj3tSd0wO7l0RMa-2Fg4oVt1Y-3DMqUx_3REPWe-2FF-2F9ZAj6tQH1B1=\r\nChpRNdgCzd4zgT6CuME-2B6XzS4Aq7CdwMg2FLL2DZTNv7K1tsrOdrEON7Tcox-2F0qiBmEByW5=\r\nVF5g9w2Bnx0R1AdwGMI-2FtoQGwffmtETFM4p3Krwq0vRUIMm-2Bxi96NBajz8NnTAGD84Rx6YB=\r\n-2B42dazpCrdICPmPbyC6U1eDLYhEyjz4TJ3DlrWbOdEo6-2BK4yTyT7Ttqps8JIYudisACHVO7=\r\nsgoyPBO98Lr9CYUh-2FQOw0xwMYkk-2BoRRzTMsM0-2FvHslCjw-3D-3D\" style=3D\"color:#=\r\n1EB0F4;text-decoration:none;\">@discord</a>\r\n    </div></td></tr><tr><td style=3D\"word-break:break-word;font-size:0px;pa=\r\ndding:0px;\" align=3D\"center\"><div style=3D\"cursor:auto;color:#99AAB5;font-f=\r\namily:Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif;font-size=\r\n:12px;line-height:24px;text-align:center;\">\r\n      444 De Haro Street, Suite 200, San Francisco, CA 94107\r\n    </div></td></tr><tr><td style=3D\"word-break:break-word;font-size:0px;pa=\r\ndding:0px;\" align=3D\"left\"><div style=3D\"cursor:auto;color:#000000;font-fam=\r\nily:Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif;font-size:1=\r\n3px;line-height:22px;text-align:left;\">\r\n      <img src=3D\"https://discord.com/api/science/560862082946433043/6e1edd=\r\nd7-89bb-465b-803d-a0f7d9936ead.gif?properties=3DeyJlbWFpbF90eXBlIjogInVzZXJ=\r\nfcGFzc3dvcmRfcmVzZXRfcmVxdWVzdCJ9\" width=3D\"1\" height=3D\"1\">\r\n    </div></td></tr></tbody></table></div><!--[if mso | IE]>\r\n      </td></tr></table>\r\n      <![endif]--></td></tr></tbody></table></div><!--[if mso | IE]>\r\n      </td></tr></table>\r\n      <![endif]--></div>\r\n<img src=3D\"https://click.discord.com/wf/open?upn=3Du001.-2BLYvBwPHq3j0PKO9=\r\nGwQSpXodX2ipL5zLGcAxnxwsOqJuPVSIepgEe0tCVdUSS9kdPGLcfFUdp4VaDtJB2pNmQx8HAzA=\r\nkUktXc58P15twv6y4LpaFnTqFt3Y-2Fi0EdiQkHc-2BMWyRuS9HCO1SB-2BUBq-2BsXadbz1eDy=\r\nEoqq8KS6WLnpBXIFuR4S6tH-2BIxmwSSfLyI-2FxSZj6RQHv2-2FOrvs5Zen8uAhJFYvJdyiD-2=\r\nFYPfCur2-2FB9CUeOyok7J2zhm-2BwVbhvqTdGUBm2DtQCuzBFEFmhtEA-3D-3D\" alt=3D\"\" w=\r\nidth=3D\"1\" height=3D\"1\" border=3D\"0\" style=3D\"height:1px !important;width:1=\r\npx !important;border-width:0 !important;margin-top:0 !important;margin-bott=\r\nom:0 !important;margin-right:0 !important;margin-left:0 !important;padding-=\r\ntop:0 !important;padding-bottom:0 !important;padding-right:0 !important;pad=\r\nding-left:0 !important;\"/></body>\r\n</html>\r\n--94a7c3da60abb8b82937ca812fbb914352acfe2b1e5a3156b4eb0077b87a--\r\n",
  "blueprintSlug": "zkemail/discord@v1",
  "command": "command"
}
```

## GET /gmail/auth

Initiates the Gmail OAuth flow. Redirects the user to Google's OAuth consent screen where they can authorize the application to access their Gmail account.

**Query Parameters:**

- `query` (required) - Gmail search query
- `blueprint` (required) - Blueprint slug for proof generation
- `command` (required) - External input command for proof

**Usage Examples:**

Discord password reset:

```
http://localhost:3000/gmail/auth?query=from:discord.com subject:"Password Reset Request for Discord"&blueprint=zkemail/discord@v1&command=reset
```

**Flow:**

1. Navigate to the endpoint with desired parameters
2. Complete the Google OAuth flow
3. After authorization, you'll be redirected to the callback endpoint with your search results

## GET /gmail/callback

OAuth callback endpoint. This is automatically called by Google after the user authorizes the application. It exchanges the authorization code for access tokens, fetches the email matching your query, and generates a ZK proof.

**Note:** This endpoint may take several minutes to complete as it performs ZK proof generation.

**Response:**

Returns an HTML page with a beautiful progress UI showing:

1. ✓ Authenticating with Gmail
2. ✓ Fetching email from Gmail
3. ✓ Generating ZK proof (this may take a few minutes)
4. ✓ Proof generated successfully!

The UI updates in real-time as each step completes, providing visual feedback with:

- Animated loading states for active steps
- Green checkmarks for completed steps
- Red error indicators if something fails
- **⚠️ Big warning message during proof generation** reminding users NOT to close the page
- Browser confirmation dialog if user tries to close the tab during proof generation
- Summary of results (Email ID, proof fields count, public inputs count)

## POST /gmail/fetch-email

Fetches an email using a provided access token with a custom search query and generates a ZK proof. Useful if you already have an access token from a previous OAuth flow.

**Note:** This endpoint may take several minutes to complete as it performs ZK proof generation.

**Request Body:**

```json
{
  "accessToken": "ya29.a0AfH6...",
  "query": "from:github.com subject:verification",
  "blueprintSlug": "zkemail/github@v1",
  "command": "verify"
}
```

**Request Body Parameters:**

- `accessToken` (required) - Gmail API access token
- `query` (required) - Gmail search query
- `blueprintSlug` (required) - Blueprint slug for proof generation
- `command` (required) - External input command for proof

**Response:**

```json
{
  "success": true,
  "email": {
    "id": "message_id",
    "raw": "raw email content..."
  },
  "proof": ["0x...", "0x...", ...],
  "publicInputs": ["0x...", "0x...", ...]
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "No matching email found"
}
```

### Gmail Search Query Examples

You must provide a Gmail search query. You can use any Gmail search operators:

- **Discord password reset:** `from:discord.com subject:"Password Reset Request for Discord"`
- **GitHub verification:** `from:github.com subject:verification`
- **Amazon orders:** `from:amazon.com subject:order`
- **Recent emails from specific sender:** `from:example.com newer_than:7d`
- **Emails with attachments:** `from:example.com has:attachment`

See [Gmail search operators](https://support.google.com/mail/answer/7190) for more query options.

Returns the first (most recent) email matching the query.
