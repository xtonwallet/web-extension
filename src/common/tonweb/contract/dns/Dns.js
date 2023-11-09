import {Cell, Address} from "./../../toncore";
import {
  DNS_CATEGORY_NEXT_RESOLVER,
  DNS_CATEGORY_SITE,
  DNS_CATEGORY_WALLET,
  createSmartContractAddressRecord,
  createADNLAddressRecord,
  createNextResolverRecord,
  parseSmartContractAddressRecord,
  parseADNLAddressRecord,
  parseNextResolverRecord,
  dnsResolve
} from  "./DnsUtils";

class Dns {
  /**
     * @param provider  {HttpProvider}
     */
  constructor(provider) {
    this.provider = provider;
  }

  /**
     * @returns {Promise<Address>}
     */
  async getRootDnsAddress() {
    const cell = await this.provider.getConfigParam(4);
    const byteArray = cell.bits._data;
    if (byteArray.length !== 256 / 8) throw new Error('Invalid ConfigParam 4 length ' + byteArray.length);
    return new Address(-1, byteArray);
  }

  /**
     * @param domain    {string} e.g "sub.alice.ton"
     * @param category  {string | undefined} category of requested DNS record, null for all categories
     * @param oneStep {boolean | undefined}  non-recursive
     * @returns {Promise<Cell | Address | ADNLAddress | null>}
     */
  async resolve(domain, category, oneStep) {
    const rootDnsAddress = await this.getRootDnsAddress();
    return dnsResolve(this.provider, rootDnsAddress.toString(), domain, category, oneStep);
  }

  /**
     * @param domain    {string} e.g "sub.alice.ton"
     * @returns {Promise<Address | null>}
     */
  getWalletAddress(domain) {
    return this.resolve(domain, DNS_CATEGORY_WALLET);
  }

  /**
     * @param domain    {string} e.g "sub.alice.ton"
     * @returns {Promise<ADNLAddress | null>}
     */
  getSiteAddress(domain) {
    return this.resolve(domain, DNS_CATEGORY_SITE);
  }
}

Dns.resolve = dnsResolve;
Dns.createSmartContractAddressRecord = createSmartContractAddressRecord;
Dns.createADNLAddressRecord = createADNLAddressRecord;
Dns.createNextResolverRecord = createNextResolverRecord;
Dns.parseNextResolverRecord = parseNextResolverRecord;
Dns.parseADNLAddressRecord = parseADNLAddressRecord;
Dns.parseSmartContractAddressRecord = parseSmartContractAddressRecord;
Dns.DNS_CATEGORY_NEXT_RESOLVER = DNS_CATEGORY_NEXT_RESOLVER;
Dns.DNS_CATEGORY_WALLET = DNS_CATEGORY_WALLET;
Dns.DNS_CATEGORY_SITE = DNS_CATEGORY_SITE;

export default Dns;