import JSZip from 'jszip';
import { ProjectFile } from '../types';

export interface ApkAnalysisResult {
  packageName?: string;
  isRenpyApp: boolean;
  gameFilesCount: number;
  files: ProjectFile[];
  manifestSummary?: {
    permissions: string[];
    activities: string[];
  };
}

export async function parseApkOrZipFile(file: File): Promise<ApkAnalysisResult> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const files: ProjectFile[] = [];
  let isRenpyApp = false;
  let gameFilesCount = 0;
  const permissions: string[] = [];
  const activities: string[] = [];

  const fileEntries = Object.entries(loadedZip.files);

  for (const [relativePath, zipEntry] of fileEntries) {
    if (zipEntry.dir) continue;

    // Check if it's a Ren'Py app
    if (
      relativePath.startsWith('assets/x-game/') ||
      relativePath.startsWith('assets/game/') ||
      relativePath.endsWith('.rpy') ||
      relativePath.endsWith('.rpyc') ||
      relativePath.endsWith('.rpa')
    ) {
      isRenpyApp = true;
      if (relativePath.endsWith('.rpy') || relativePath.endsWith('.rpyc') || relativePath.endsWith('.rpa')) {
        gameFilesCount++;
      }
    }

    // Determine if it's readable as text
    const isText =
      relativePath.endsWith('.rpy') ||
      relativePath.endsWith('.py') ||
      relativePath.endsWith('.txt') ||
      relativePath.endsWith('.json') ||
      relativePath.endsWith('.xml') ||
      relativePath.endsWith('.html') ||
      relativePath.endsWith('.css') ||
      relativePath.endsWith('.md') ||
      relativePath.endsWith('.yaml') ||
      relativePath.endsWith('.yml') ||
      relativePath.endsWith('.smali');

    let content = '';
    if (isText) {
      try {
        content = await zipEntry.async('string');
      } catch {
        content = '[Failed to decode text file]';
      }
    } else {
      content = `[Binary file: ${zipEntry.name} - ${(zipEntry as any)._data?.uncompressedSize || 'unknown'} bytes]`;
    }

    files.push({
      name: relativePath.split('/').pop() || relativePath,
      path: relativePath,
      content,
      isBinary: !isText,
    });
  }

  // Check AndroidManifest.xml if present
  const manifestFile = files.find((f) => f.path.toLowerCase() === 'androidmanifest.xml');
  let packageName = 'Unknown Package';

  if (manifestFile && manifestFile.content) {
    // Quick extract printable strings / package
    const packageMatch = manifestFile.content.match(/package="([^"]+)"/) || manifestFile.content.match(/([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)/);
    if (packageMatch) {
      packageName = packageMatch[1];
    }

    const permMatches = manifestFile.content.matchAll(/android\.permission\.([A-Z_]+)/g);
    for (const m of permMatches) {
      if (!permissions.includes(m[1])) permissions.push(m[1]);
    }
  }

  return {
    packageName,
    isRenpyApp,
    gameFilesCount,
    files,
    manifestSummary: {
      permissions,
      activities,
    },
  };
}

export async function exportModifiedZip(files: ProjectFile[]): Promise<Blob> {
  const zip = new JSZip();

  for (const f of files) {
    if (!f.isBinary) {
      zip.file(f.path, f.content);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}
