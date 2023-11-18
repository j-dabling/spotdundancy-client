// popup.js
document.addEventListener("DOMContentLoaded", function () {
  const urlElement = document.getElementById("url");
  const closeButton = document.getElementById("closeButton");
  const collectPlaylistButton = document.getElementById("collectPlaylistButton");


  // Get the current URL and display it in the popup
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    urlElement.textContent = url;
  });

  // Define the behavior for the Close button
  closeButton.addEventListener("click", () => {
    window.close();
  });

  collectPlaylistButton.addEventListener("click", async () => {
    const url = urlElement.textContent;
    // I should probably hide this... ill ask jacob about it
    const clientId = '6c07df458f764d6eba746f4f3d282efc';
    const clientSecret = '13e852c924834ab9a87c2e4d9f4c3215';

    // Get client access token
    const accessToken = await getAccessToken(clientId, clientSecret);

    if (accessToken) {
      // Get playlist details
      const playlistData = await getPlaylistDetails(url, accessToken);

      if (playlistData) {
        // Save playlist to CSV
        savePlaylistToCSV(playlistData.playlistName, playlistData.tracks);
      } else {
        console.error('Failed to get playlist details');
      }
    } else {
      console.error('Failed to get access token');
    }
  });
});

async function savePlaylistToCSV(playlistName, playlistDetails) {
  try {
      if (!playlistDetails) {
          console.error('Failed to get playlist details');
          return;
      }

      const csvContent = convertToCSV(playlistDetails);
      const blob = new Blob([csvContent], { type: 'text/csv' });

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${playlistName}_playlist.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  } catch (error) {
      console.error('Error while saving playlist to CSV:', error);
  }
}


// Convert playlist details to CSV format
function convertToCSV(playlistDetails) {
  const headers = Object.keys(playlistDetails[0]).join(',');

  const rows = playlistDetails.map(track => {
    return Object.values(track).map(value => `"${value}"`).join(',');
  });

  return `${headers}\n${rows.join('\n')}`;
}

async function getAccessToken(clientId, clientSecret) {
  // Spotify API token endpoint
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';

  // Base64 encode the client ID and client secret
  const credentials = btoa(`${clientId}:${clientSecret}`);

  // Set up the request headers
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${credentials}`,
  };

  // Set up the request body
  const requestBody = new URLSearchParams({
    'grant_type': 'client_credentials'
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: headers,
      body: requestBody.toString(),
    });

    if (response.ok) {
      const data = await response.json();
      const accessToken = data.access_token;
      return accessToken;
    } else {
      console.error('Failed to get access token:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error while requesting access token:', error);
    return null;
  }
}

async function getPlaylistDetails(playlistUrl, accessTokenPromise) {
  try {
    // Extract the playlist ID from the URL if provided
    const playlistIdMatch = playlistUrl.match(/playlist\/(\w+)/);
    if (!playlistIdMatch) {
      throw new Error('Invalid playlist URL');
    }
    const playlistId = playlistIdMatch[1];

    // Get the access token by awaiting the promise
    const accessToken = await accessTokenPromise;

    // Spotify API endpoint for getting playlist details
    const playlistEndpoint = `https://api.spotify.com/v1/playlists/${playlistId}`;

    // Set up headers with the access token
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    // Fetch the playlist details
    const response = await fetch(playlistEndpoint, {
      method: 'GET',
      headers: headers,
    });

    if (response.ok) {
      const playlistData = await response.json();

      const playlistName = playlistData.name;

      // Extract track details
      const tracks = playlistData.tracks.items.map(item => {
        const track = item.track;
        const artists = track.artists.map(artist => artist.name);

        return {
          title: track.name,
          artist: artists.join(', '),
          album: track.album.name,
          coverArtUrl: track.album.images[0].url,
          releaseDate: track.album.release_date,
          // Add more metadata fields here as needed
        };
      });

      return { playlistName, tracks };
    } else {
      console.error('Failed to fetch playlist details:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error while getting playlist details:', error);
    return null;
  }
}