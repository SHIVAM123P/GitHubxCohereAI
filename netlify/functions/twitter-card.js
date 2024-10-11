exports.handler = async (event, context) => {
    const { username, imageUrl } = event.queryStringParameters;
  
    const htmlContent = `
      <html>
        <head>
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="Check out ${username}'s GitHub Stats!">
          <meta name="twitter:description" content="Contributions, streaks, and more!">
          <meta name="twitter:image" content="${imageUrl}">
          <meta name="twitter:image:alt" content="${username}'s GitHub stats">
          <title>${username}'s GitHub Stats</title>
          <script>
            window.location.href = 'https://git-statss.netlify.app/api/share/${username}?imageUrl=${encodeURIComponent(imageUrl)}';
          </script>
        </head>
        <body>
          <p>Redirecting to Git Stats...</p>
        </body>
      </html>
    `;
  
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: htmlContent,
    };
  };