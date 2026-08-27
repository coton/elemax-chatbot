import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const mainComponent = readFileSync('app/components/index.tsx', 'utf8')

assert.match(
  mainComponent,
  /const normalizedImageConfig = file_upload\?\.image \|\|[\s\S]*allowed_file_types\?\.includes\('image'\)/,
  'normalized Dify file upload responses should be recognized as image upload configuration',
)

assert.match(
  mainComponent,
  /transfer_methods: file_upload\?\.allowed_file_upload_methods/,
  'normalized local file methods should be passed to the image uploader',
)

assert.match(
  mainComponent,
  /file_upload\?\.fileUploadConfig\?\.image_file_size_limit/,
  'normalized image size limits should be passed to the image uploader',
)
