import { PlaywrightCrawler, Dataset } from "crawlee";

const domain = "salesforce";

const crawler = new PlaywrightCrawler({
  async requestHandler({ request, page, enqueueLinks, log }) {
    const title = await page.title();
    log.info(`Title of ${request.loadedUrl} is '${title}'`);

    // Use a selector to find the desired HTML element for Salesforce text and extract its text content.
    const adHeader = await page.textContent(".block.text-md");

    // Use a selector to find the desired <p> element and extract its text content.
    const adCopy = await page.textContent(".commentary__content");

    // Wait for the specific div that wraps the a element to ensure it's loaded
    await page
      .waitForSelector(
        "div.flex.justify-center.py-1.border-t-1.border-solid.border-color-border-faint",
        { timeout: 5000 }
      )
      .catch((e) =>
        log.warn(
          `Wrapper div not found within timeout period on ${request.loadedUrl}: ${e.message}`
        )
      );

    // Attempt to extract the URL from the a element within the specific div
    const adUrl = await page
      .$eval(
        'div.flex.justify-center.py-1.border-t-1.border-solid.border-color-border-faint > a[data-tracking-control-name="ad_library_view_ad_detail"]',
        (el) => el.href
      )
      .catch((e) => {
        log.warn(
          `Failed to extract ad URL on ${request.loadedUrl}: ${e.message}`
        );
        return ""; // Return an empty string or a default value if the element is not found.
      });

    // Log the extracted text for debugging purposes.
    log.info(`Ad Heading: ${adHeader}`);
    log.info(`Ad Copy: ${adCopy}`);
    log.info(`Ad Url: ${adUrl}`);

    // Save results as JSON to ./storage/datasets/default
    await Dataset.pushData({
      title,
      url: request.loadedUrl,
      adHeader,
      adCopy,
      adUrl,
    });

    // Extract links from the current page and add them to the crawling queue.
    await enqueueLinks();
  },
  maxRequestsPerCrawl: 50,
});

// It's important to define 'domain' before using it in the crawler.run method.
await crawler.run([
  `https://www.linkedin.com/ad-library/search?accountOwner=${domain}`,
]);
