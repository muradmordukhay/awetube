export function buildTranscodingQuery(
  tusUri: string,
  videoId: string,
  callbackUrl: string
) {
  const s3Destination = {
    url: `s3://${process.env.QENCODE_S3_BUCKET}/videos/${videoId}/`,
    key: process.env.QENCODE_S3_ACCESS_KEY!,
    secret: process.env.QENCODE_S3_SECRET_KEY!,
  };

  return {
    query: {
      source: tusUri,
      format: [
        {
          output: "advanced_hls",
          destination: {
            ...s3Destination,
            url: `${s3Destination.url}hls/`,
          },
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
          destination: {
            ...s3Destination,
            url: `${s3Destination.url}thumbs/`,
          },
          width: 1280,
          height: 720,
          time: 5,
        },
      ],
      callback_url: callbackUrl,
    },
  };
}
