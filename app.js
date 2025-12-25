// Author: ipangbrian
import axios from "axios";

class Ipangbrian {
  static token = process.env.FELO_TOKEN || "";

  static setToken(token) {
    this.token = token || "";
  }

  static mapRatioToSize(ratio) {
    if (ratio === "9:16") return { w: 1024, h: 1536 };
    if (ratio === "16:9") return { w: 1536, h: 1024 };
    return { w: 1024, h: 1024 };
  }

  static async callApi(payload, attempt = 0) {
    if (attempt > 2) {
      return { success: false, error: "server busy" };
    }
    if (!this.token) {
      return { success: false, error: "missing FELO_TOKEN" };
    }

    try {
      const res = await axios.post(
        "https://api-ext.felo.ai/ai/image/generate",
        payload,
        {
          headers: {
            authorization: this.token,
            "content-type": "application/json",
            accept: "application/json, text/plain, */*",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "x-visitor-id": "ipangbrian-scraper",
            origin: "https://felo.ai",
            referer: "https://felo.ai/",
          },
          timeout: 90000,
        }
      );

      const data = res.data;
      const url =
        data?.data || data?.url || data?.result || data?.output || null;

      if (!url) {
        return { success: false, error: "no url", raw: data };
      }

      return { success: true, url, raw: data };
    } catch (err) {
      const status = err?.response?.status;
      if ([401, 403, 429].includes(status || 0)) {
        return this.callApi(payload, attempt + 1);
      }
      return {
        success: false,
        error: err?.message || "request error",
      };
    }
  }

  static async generate(prompt, options = {}) {
    const ratio =
      ["1:1", "9:16", "16:9"].includes(options.ratio) && options.ratio
        ? options.ratio
        : "1:1";

    const { w, h } = this.mapRatioToSize(ratio);

    const payload = {
      input: prompt,
      prompt,
      text: prompt,
      query: prompt,
      model_type: "DALLE3",
      width: w,
      height: h,
      output_format: "png",
    };

    return this.callApi(payload);
  }
}

export default Ipangbrian;
