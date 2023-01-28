// chrome extension
// add event listener to the page route

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // listen for messages sent from background.js
  if (request.message === "URL_CHANGED") {
    fetchHiddenPricingOnListingPage(request.url); // new url is now in content scripts!
  }
});

async function fetchHiddenPricingOnListingPage(href: string) {
  if (href.startsWith("https://www.realestate.com.au/property-")) {
    const url = new URL(href);
    const path = url.pathname;
    const id = path.split("-").pop();
    // Reverse engineered the fetch request.
    try {
      const response = await fetch("https://lexa.realestate.com.au/graphql", {
        headers: {
          accept: "application/graphql+json, application/json",
          "accept-language": "en-GB,en;q=0.9",
          "content-type": "application/json",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "sec-gpc": "1",
        },
        referrer: "https://www.realestate.com.au/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body:
          '{"query":"query getListingById($id: ListingId!){details: detailsV2(id: $id){__typename, trackingData}}","variables":{"id":"' +
          id +
          '"}}',
        method: "POST",
        mode: "cors",
        credentials: "omit",
      });
      const json = await response.json();
      const trackingData = json.data.details.trackingData;
      const parsedTrackingData = JSON.parse(trackingData);
      const hiddenPricing =
        parsedTrackingData?.listing.data?.marketing_price_range ??
        "No hidden pricing";
      const addressElement = document.getElementsByClassName(
        "property-info__address-actions"
      )[0];
      const priceRangeText = `Price Range: ${hiddenPricing}`;
      // create a new paragraph element
      const newP = document.createElement("p");
      // and give it some content
      const newContent = document.createTextNode(priceRangeText);
      newP.appendChild(newContent); // add the text node to the newly created paragraph.
      // add the text node after the address element
      addressElement.parentNode?.insertBefore(newP, addressElement.nextSibling);
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log("Not a listing page");
  }
}

fetchHiddenPricingOnListingPage(window.location.href);
