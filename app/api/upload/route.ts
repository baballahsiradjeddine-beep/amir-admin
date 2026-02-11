import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    // Check if we can parse the content type
    const contentType = request.headers.get('content-type') || ''

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content type must be multipart/form-data' }, { status: 400 })
    }

    let file: File | null = null

    try {
      const formData = await request.formData()
      file = formData.get('file') as File
    } catch (e) {
      console.error('[v0] Error parsing form data:', e)
      return NextResponse.json({ error: 'Failed to parse form data. Please ensure you are sending a valid file.' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Check for Vercel Blob Token
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN

    // Unique filename
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `company-${uniqueSuffix}-${safeFilename}`

    if (hasBlobToken) {
      // Upload to Vercel Blob
      try {
        const blob = await put(filename, file, {
          access: 'public',
        })

        return NextResponse.json({
          url: blob.url,
          filename: file.name,
          size: file.size,
        })
      } catch (blobError) {
        console.error('[v0] Vercel Blob upload error:', blobError)
        // Fallback to local if blob fails (optional, but good for stability)
        // For now, let's report the error
        return NextResponse.json({ error: 'Cloud storage upload failed' }, { status: 500 })
      }
    } else {
      // Local Fallback Storage
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

      // Ensure directory exists
      if (!existsSync(uploadsDir)) {
        await fs.mkdir(uploadsDir, { recursive: true })
      }

      const filePath = path.join(uploadsDir, filename)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      await fs.writeFile(filePath, buffer)

      // Get the host from headers for absolute URL if needed, or just return relative
      // Relative URL is usually fine for Next.js <Image> or standard <img> tags
      return NextResponse.json({
        url: `/uploads/${filename}`,
        filename: file.name,
        size: file.size,
      })
    }
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json({ error: `Upload failed: ${(error as any).message}` }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json()

    // Check if it's a local URL
    if (url.startsWith('/uploads/')) {
      const filename = url.replace('/uploads/', '')
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename)

      if (existsSync(filePath)) {
        await fs.unlink(filePath)
      }
      return NextResponse.json({ success: true })
    }

    // Otherwise delete from Vercel Blob
    await del(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
