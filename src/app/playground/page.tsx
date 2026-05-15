export default function Playground() {
  return (
    <main className="min-h-screen bg-white p-12">

      <p className="text-xs tracking-widest text-gray-400 uppercase mb-8">
        Tailwind playground
      </p>

      {/* EXPERIMENT BELOW HERE */}

      <h1 className="text-4xl font-medium text-gray-900 mb-4">
        Edit me
      </h1>

      <h2 className="text-3xl font-medium text-gray-900 mb-3">
        Change the classes on this heading and see what happens.  
      </h2>

      
      <p className="text-base text-gray-500 max-w-lg leading-normal mb-4">
        Change the classes on anything here and see what happens.
      </p>

      <div className = "flex gap-4">
      <button className = "px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">
        A button
      </button>  
      <button className="px-5 py-5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700">
        A button
      </button>
      </div>



      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900">Card one</p>
          <p className="text-sm text-gray-500 mt-1">Try changing bg-gray-100</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900">Card two</p>
          <p className="text-sm text-gray-500 mt-1">Try changing rounded-lg</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900">Card three</p>
          <p className="text-sm text-gray-500 mt-1">Try changing p-4</p>
        </div>
      </div>

    </main>
  )
}