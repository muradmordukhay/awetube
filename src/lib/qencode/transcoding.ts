export function buildTranscodingQuery(
  tusUri: string,
  videoId: string,
  callbackUrl: string
) {
  const bucket = process.env.QENCODE_S3_BUCKET!;
  const region = process.env.QENCODE_S3_REGION || "us-west";
  const baseUrl = `s3://${region}.s3.qencode.com/${bucket}/videos/${videoId}/`;

  return {
    query: {
      source: tusUri,
      format: [
        {
          output: "advanced_hls",
          destination: { url: `${baseUrl}hls/` },
          stream: [
            {
              size: "1920x1080",
              video_codec: "libx264",
              bitrate: 5000,
              audio_bitrate: 192,
            },
            {
              size: "1280x720",
              video_codec: "libx264",
              bitrate: 2500,
              audio_bitrate: 128,
            },
            {
              size: "854x480",
              video_codec: "libx264",
              bitrate: 1200,
              audio_bitrate: 128,
            },
            {
              size: "640x360",
              video_codec: "libx264",
              bitrate: 800,
              audio_bitrate: 96,
            },
          ],
        },
        {
          output: "thumbnail",
          destination: { url: `${baseUrl}thumbs/` },
          width: 1280,
          height: 720,
          time: 5,
        },
      ],
      callback_url: callbackUrl,
    },
  };
}
