/**
 * Types related to FingerprintJS integration
 * We only need requestId and visitorId from the full FingerprintJS visitor data
 */

export interface VisitorData {
  /**
   * @description The unique identifier of the request to get visitor data
   */
  requestId: string;
  /**
   * @description The unique identifier of the visitor
   */
  visitorId: string;
}
