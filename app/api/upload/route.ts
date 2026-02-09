import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

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
      const blob = await put(filename, file, {
        access: 'public',
      })

      return NextResponse.json({
        url: blob.url,
        filename: file.name,
        size: file.size,
      })
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

      return NextResponse.json({
        url: `/uploads/${filename}`,
        filename: file.name,
        size: file.size,
      })
    }
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
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
