'use strict';

/**
 * Generic, reusable form interaction actions.
 * Use these for any form-based UI interaction not specific to a single platform.
 */

/**
 * Fills multiple form fields from a data map.
 * @param {import('@playwright/test').Page} page
 * @param {object} fieldMap - { selector: value }
 */
async function fillForm(page, fieldMap) {
  for (const [selector, value] of Object.entries(fieldMap)) {
    if (value === null || value === undefined) {
      continue;
    }
    const locator = page.locator(selector);
    const tagName = await locator.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'input');

    if (tagName === 'select') {
      await locator.selectOption(String(value));
    } else if (tagName === 'textarea') {
      await locator.clear();
      await locator.fill(String(value));
    } else {
      const type = await locator.getAttribute('type').catch(() => 'text');
      if (type === 'checkbox') {
        value ? await locator.check() : await locator.uncheck();
      } else if (type === 'radio') {
        if (value) {
          await locator.check();
        }
      } else {
        await locator.clear();
        await locator.fill(String(value));
      }
    }
  }
}

/**
 * Clears and re-fills a single text input.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} value
 */
async function clearAndType(page, selector, value) {
  const locator = page.locator(selector);
  await locator.click({ clickCount: 3 });
  await locator.fill(value);
}

/**
 * Selects an option from a native <select> by visible text.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} text
 */
async function selectByText(page, selector, text) {
  await page.locator(selector).selectOption({ label: text });
}

/**
 * Searches in a Select2 or similar enhanced dropdown.
 * @param {import('@playwright/test').Page} page
 * @param {string} containerSelector - wrapping element selector
 * @param {string} searchText
 */
async function selectFromSelect2(page, containerSelector, searchText) {
  await page.locator(`${containerSelector} .select2-selection`).click();
  const searchInput = page.locator('.select2-search__field');
  await searchInput.fill(searchText);
  await page.locator(`.select2-results__option:has-text("${searchText}")`).first().click();
}

/**
 * Reads all option texts from a <select> element.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @returns {Promise<string[]>}
 */
async function getSelectOptions(page, selector) {
  return await page.locator(`${selector} option`).allTextContents();
}

/**
 * Submits a form by pressing Enter on the last focused field or clicking submit.
 * @param {import('@playwright/test').Page} page
 * @param {string} submitSelector
 */
async function submitForm(page, submitSelector) {
  await page.locator(submitSelector).click();
  await page.waitForLoadState('domcontentloaded');
}

module.exports = {
  fillForm,
  clearAndType,
  selectByText,
  selectFromSelect2,
  getSelectOptions,
  submitForm,
};
