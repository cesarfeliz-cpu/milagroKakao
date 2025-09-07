import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error'
  message?: string
  fileName?: string
}

function App() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadStatus({ status: 'uploading', fileName: file.name })

    const formData = new FormData()
    formData.append('excel', file)

    try {
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadStatus({
          status: 'success',
          message: result.message,
          fileName: file.name
        })
      } else {
        setUploadStatus({
          status: 'error',
          message: result.message || 'Error al procesar el archivo',
          fileName: file.name
        })
      }
    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: 'Error de conexión con el servidor',
        fileName: file.name
      })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: uploadStatus.status === 'uploading'
  })

  const resetUpload = () => {
    setUploadStatus({ status: 'idle' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-kakao-400 to-kakao-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Kakao 40</h1>
            <p className="text-white/70 text-sm">Sistema de Gestión Empresarial</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="w-full max-w-2xl">
          <div className="glass-effect rounded-3xl p-8 shadow-2xl animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-kakao-400 to-kakao-500 rounded-2xl mb-6 shadow-lg">
                <FileSpreadsheet className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Carga de Archivos Excel
              </h2>
              <p className="text-white/80 text-lg">
                Arrastra y suelta tu archivo Excel o haz clic para seleccionar
              </p>
            </div>

            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                transition-all duration-300 group
                ${isDragActive 
                  ? 'border-kakao-400 bg-kakao-400/10 scale-105' 
                  : 'border-white/30 hover:border-kakao-400 hover:bg-white/5'
                }
                ${uploadStatus.status === 'uploading' ? 'pointer-events-none opacity-70' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              {uploadStatus.status === 'idle' && (
                <div className="animate-slide-up">
                  <Upload className={`w-16 h-16 mx-auto mb-6 transition-colors duration-300 ${
                    isDragActive ? 'text-kakao-400' : 'text-white/60 group-hover:text-kakao-400'
                  }`} />
                  <p className="text-xl font-semibold text-white mb-2">
                    {isDragActive ? '¡Suelta el archivo aquí!' : 'Selecciona tu archivo Excel'}
                  </p>
                  <p className="text-white/70">
                    Formatos soportados: .xlsx, .xls (máximo 10MB)
                  </p>
                </div>
              )}

              {uploadStatus.status === 'uploading' && (
                <div className="animate-slide-up">
                  <Loader2 className="w-16 h-16 mx-auto mb-6 text-kakao-400 animate-spin" />
                  <p className="text-xl font-semibold text-white mb-2">
                    Procesando archivo...
                  </p>
                  <p className="text-white/70">
                    {uploadStatus.fileName}
                  </p>
                </div>
              )}

              {uploadStatus.status === 'success' && (
                <div className="animate-slide-up">
                  <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-400" />
                  <p className="text-xl font-semibold text-white mb-2">
                    ¡Archivo procesado exitosamente!
                  </p>
                  <p className="text-white/70 mb-6">
                    {uploadStatus.message}
                  </p>
                  <button
                    onClick={resetUpload}
                    className="btn-primary"
                  >
                    Subir otro archivo
                  </button>
                </div>
              )}

              {uploadStatus.status === 'error' && (
                <div className="animate-slide-up">
                  <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-400" />
                  <p className="text-xl font-semibold text-white mb-2">
                    Error al procesar archivo
                  </p>
                  <p className="text-red-300 mb-6">
                    {uploadStatus.message}
                  </p>
                  <button
                    onClick={resetUpload}
                    className="btn-primary"
                  >
                    Intentar nuevamente
                  </button>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="glass-effect rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Seguro</h3>
                <p className="text-white/70 text-sm">Procesamiento seguro de datos</p>
              </div>
              
              <div className="glass-effect rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Loader2 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Rápido</h3>
                <p className="text-white/70 text-sm">Procesamiento en tiempo real</p>
              </div>
              
              <div className="glass-effect rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Compatible</h3>
                <p className="text-white/70 text-sm">Soporte para Excel .xlsx/.xls</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App