import QRCode from 'qrcode';

export class QrService {
  public static async generateAssetQrCode(assetTag: string, origin: string = 'http://localhost:3000'): Promise<{
    assetTag: string;
    scanUrl: string;
    dataUrl: string;
  }> {
    const scanUrl = `${origin}/scan/${assetTag}`;
    const dataUrl = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return {
      assetTag,
      scanUrl,
      dataUrl,
    };
  }
}
