var templateURL = 'https://www.wikiart.org/en/wojciech-siudmak/mode/all-paintings?json=2';
$('#generate-script').click(function() {
	var artistId = $('#artist-id').val();
	var artistUrl = `https://www.wikiart.org/en/${artistId}/mode/all-paintings?json=2`;
	var allURLS = [];
	fetchAllDataAndGetAllUrls(allURLS, artistUrl);
});

function fetchAllDataAndGetAllUrls(allURLS, artistUrl) {
	// start loader.
	fetchRecursive(allURLS, artistUrl, 0, null);
}

function fetchRecursive(allURLS, url, pageIndex, pageThreshold) {
	// page threshold can be set after first fetch
	if (pageThreshold != null) {
		if (pageIndex > pageThreshold) {
			// done with fetching all URLS, lets create scripts now
			generateScripts(allURLS);
			return;
		}
	}
	window.fetch(`${url}&page=${pageIndex}`, {
		mode: 'cors',
		headers: {
			'Access-Control-Allow-Origin':'*'
		}
	}).then(response => {
		response.json().then(authorData => {
			if (authorData.Paintings && authorData.Paintings.length > 0) {
				allURLS = allURLS.concat(authorData.Paintings.map(painting => painting.image));
				console.log(`fetching Page : `, pageIndex , ' of ', pageThreshold);
				fetchRecursive(allURLS, url, pageIndex + 1, Math.ceil(authorData.AllPaintingsCount/authorData.PageSize) + 1);
			} else {
				console.log('got none');
				generateScripts(allURLS);
				return;
			}
		}).catch(err2 => {
			// show error message.
			console.log('err2', err2)
		});
	}).catch(err => {
		// stop propograting, display error.
		console.log('err', err);
	});
}

function generateScripts(allURLS) {
	// hide loader
	const uniqueURLS = [...new Set(allURLS)];
	const buttonsDisabled = $('.btn-script-dl');
	buttonsDisabled.removeClass('btn-disabled');
	buttonsDisabled.removeAttr('disabled');
	window.windowsPSCmd = generateWindowsPS1Script(uniqueURLS);
	window.linuxCURL = generateLinuxCURLScript(uniqueURLS);
	window.linuxWGET = generateLinuxWgetScript(uniqueURLS);
	window.OSXCURL = generateOSXCURLScript(uniqueURLS);
}

function generateWindowsPS1Script(uniqueURLS) {
	let windowsPSCmd = `mkdir -p wikiart-dl
cd wikiart-dl
echo 'Starting download'\n`;
	windowsPSCmd += uniqueURLS.map(url => `Invoke-WebRequest "${url}"`).join('\n');
	windowsPSCmd += `\necho 'Done Downloading'`;
	return windowsPSCmd;
}

function generateLinuxCURLScript(uniqueURLS) {
	let linuxCURL = `#!/bin/bash
mkdir -p wikiart-dl
cd wikiart-dl
echo 'Starting download'\n`;
	linuxCURL += uniqueURLS.map(url => `curl -O "${url}"`).join('\n');
	linuxCURL += `\necho 'Done Downloading'`;
	return linuxCURL;
}

function generateLinuxWgetScript(uniqueURLS) {
	let linuxWGET = `#!/bin/bash
mkdir -p wikiart-dl
cd wikiart-dl
echo 'Starting download'\n`;
	linuxWGET += uniqueURLS.map(url => `wget "${url}"`).join('\n');
	linuxWGET += `\necho 'Done Downloading'`;
	return linuxWGET;
}

function generateOSXCURLScript(uniqueURLS) {
	let OSCURL = `#!/bin/bash
mkdir -p wikiart-dl
cd wikiart-dl 
echo 'Starting download'\n`;
	OSCURL += uniqueURLS.map(url => `curl -O "${url}"`).join('\n');
	OSCURL += `\necho 'Done Downloading'`;
	return OSCURL;
}

$('.btn-script-dl').click(function() {
	downloadScript(this.id);
});

function downloadScript(scriptType) {
	const artistId = $('#artist-id').val();
	let scriptData = null;
	let scriptSuffix = '.sh';
	switch(scriptType) {
		case 'windows-ps':
			scriptData = window.windowsPSCmd;
			scriptSuffix = '.ps1';
			break;
		case 'linux-wget':
			scriptData = window.linuxWGET;
			break;
		case 'linux-curl':
		case 'osx-curl':
			scriptData = window.linuxCURL;
			break;
		default:
			console.log('default');

	}
	const blob = new Blob([scriptData], { type: 'octet/stream' });
	const dlUrl = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = dlUrl;
	a.download = `${artistId}-${scriptType}${scriptSuffix}`;
	a.click();
	URL.revokeObjectURL(dlUrl);
}