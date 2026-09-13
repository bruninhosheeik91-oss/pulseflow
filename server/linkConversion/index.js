'use strict';
const { createAffiliateLinkConverter, extractUrls } = require('./affiliateLinkConverter');
const { isShopeeUrl } = require('./shopeeConverter');

module.exports = { createAffiliateLinkConverter, extractUrls, isShopeeUrl };