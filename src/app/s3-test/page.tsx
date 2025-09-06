import S3UploadDemo from '@/components/S3UploadDemo'

export default function S3TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            S3 Upload Test
          </h1>
          <p className="text-gray-600">
            Test direct S3 upload functionality with presigned URLs
          </p>
        </div>

        <S3UploadDemo />

        <div className="max-w-2xl mx-auto mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Select a video or audio file</li>
            <li>
              2. Click &quot;Upload to S3&quot; to get presigned URL from
              backend
            </li>
            <li>3. File is uploaded directly to S3 bucket</li>
            <li>
              4. Test file accessibility with &quot;Test Access&quot; button
            </li>
            <li>5. Click the S3 URL to view/download the file</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
