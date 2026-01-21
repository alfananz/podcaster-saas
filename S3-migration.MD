1. The Upload Phase (Direct-to-Cloud)
Instead of convex.storage.upload(), the flow becomes:

Request: The Client asks Convex: "I want to upload video.mp4 (500MB)."

Authorize: Convex checks permissions (is this user an Admin/Client?).

Sign: Convex uses its secret AWS keys to generate a Presigned Upload URL. This is a special S3 link that allows write access for only this specific filename for the next 30 minutes.

Transfer: The Frontend receives this URL and uploads the file directly to AWS S3. The heavy video data never touches your Convex server.

Confirm: Once S3 says "200 OK", the frontend tells Convex: "Upload complete. The file is at Key: videos/ep-82-v1.mp4."

2. The Storage Phase (Metadata vs. Blob)
Convex Database: We stop storing the storageId (Convex internal ID). Instead, we store the S3 Key (the file path, e.g., projects/user_123/ep_04.mp4) in your episodes and versions tables.

AWS S3: Holds the actual binary data.

3. The Delivery Phase (Playback)
We rarely want to serve video directly from S3 because it's slower and costs more per request.

The Pro Move: We put AWS CloudFront (CDN) in front of the S3 bucket.

The Flow: When the video player requests the file, it hits CloudFront. CloudFront caches the video at an edge server near the user (e.g., in London or Tokyo) so playback is instant, buffering is minimized, and scrubbing is smooth.

Why This is Better for "Mello Studio"
Resumable Uploads: S3 supports "Multipart Uploads." If a user is uploading a 2GB file and their internet blips at 90%, they don't have to start over. We can resume the chunks.

Processing Triggers: S3 has a feature called "Event Notifications." As soon as a file lands in the bucket, S3 can trigger an AWS Lambda function to automatically Transcribe it or generate a Thumbnail, then update Convex via a webhook. It automates the "Processing State" we just designed.

Security: Your bucket is Private. Public access is blocked. Only users with a URL signed by your Convex backend can see the video.

This is the ideal MVP setup. By skipping transcoding and CDNs for now, we reduce complexity by about 60%. We essentially treat AWS S3 as a "Secure Hard Drive" that your frontend talks to directly.

Here is the architectural breakdown of how we implement the **"Direct-to-S3"** flow for Mello Studio.

### The 3-Phase Strategy

#### Phase 1: The AWS Setup (Infrastructure)

Before writing code, we need to configure the "Garage" (S3) so it accepts cars from our "Valet" (The Browser).

1. **The Bucket:** We create a dedicated bucket (e.g., `mello-studio-assets`).
2. **Block Public Access:** **Crucial.** We turn "Block all public access" **ON**. No one should be able to guess a URL and download a client's unreleased episode.
3. **CORS (Cross-Origin Resource Sharing):** This is the most common point of failure. By default, S3 blocks browsers from uploading data. We must configure the bucket to explicitly say: *"I accept `PUT` requests from `https://mello-studio.com` (your app)."*
4. **IAM User (The Bridge):** We create a "Robot User" in AWS IAM that has permission to generate keys. We give this user's API Key to Convex (stored in Environment Variables).

#### Phase 2: The Upload Handshake (Write Access)

This is the "Valet Key" workflow I mentioned, tailored to your MP4 requirement.

1. **User Selects File:** The Client drags `episode_final.mp4` into the dashboard.
2. **The "Ask" (Convex Mutation):** The frontend calls `generateUploadUrl`.
* It sends the file type (`video/mp4`) and size.
* Convex verifies the user's role (Admin/Client).
* Convex uses the `@aws-sdk/client-s3` library to generate a **Presigned PUT URL** valid for 15 minutes.


3. **The "Push" (Frontend):** The frontend receives the URL and uses a standard `fetch` or `axios` PUT request to send the binary file directly to Amazon.
* *Note:* The browser shows the progress bar here (0% -> 100%).


4. **The "Save" (Convex Mutation):** Once S3 responds with "200 OK", the frontend calls a second mutation: `finalizeUpload`.
* It saves the **File Key** (e.g., `projects/client_A/ep_82.mp4`) to the database.



#### Phase 3: Secure Playback (Read Access)

Since the bucket is private, a simple link like `s3.amazonaws.com/my-bucket/video.mp4` **will not work**. It will return "403 Forbidden."

We need to generate a temporary "Entry Pass" every time a user wants to watch.

1. **The Request:** When the Client loads the "Episode Page," the frontend queries `api.episodes.get`.
2. **The Signing:** Inside that query, Convex takes the stored **File Key** and generates a **Presigned GET URL**.
* This URL contains a special token at the end: `?signature=xyz...`
* We set it to expire in 1 hour (enough time to watch the episode).


3. **The Delivery:** The frontend receives this long, signed URL and feeds it directly into the `<video src="...">` tag.
4. **Result:** The video plays instantly. If the user copies the link and sends it to a friend 2 hours later, the link is dead. **Total Security.**

### Summary of Tech Stack Changes

| Component | Old Way (Convex Storage) | New Way (AWS S3) |
| --- | --- | --- |
| **File Hosting** | Convex Internal Servers | **AWS S3 Bucket** |
| **Upload Logic** | `convex.storage.upload()` | **Client-side `fetch(presignedUrl, { method: 'PUT' })**` |
| **DB Record** | Stored `storageId` (Convex ID) | Stores `s3Key` (String path) |
| **Access Control** | Convex Logic | **AWS Presigned Signatures** |
| **Cost** | High for large video volume | **Extremely Low** |

### Next Step

When you are ready to build this, the instruction to Antigravity will involve adding the `@aws-sdk/client-s3` package to your Convex folder and setting up the environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`).