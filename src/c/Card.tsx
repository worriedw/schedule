import { useState } from 'react'
import { motion, PanInfo, useAnimation } from 'framer-motion'
import { RotateCw, Check, X } from 'lucide-react'
const cards = [
    {
        id: 1,
        question: '¿Cuál es la capital de Francia?',
        answer: 'París',
        description: 'París es la capital de Francia y una de las ciudades más visitadas del mundo, conocida por la Torre Eiffel, el Louvre y su gastronomía.',
        image: '/placeholder.svg?height=400&width=300'
    },
    {
        id: 2,
        question: '¿En qué año comenzó la Segunda Guerra Mundial?',
        answer: '1939',
        description: 'La Segunda Guerra Mundial comenzó el 1 de septiembre de 1939 con la invasión de Polonia por parte de Alemania.',
        image: '/placeholder.svg?height=400&width=300'
    },
    {
        id: 3,
        question: '¿Quién pintó la Mona Lisa?',
        answer: 'Leonardo da Vinci',
        description: 'Leonardo da Vinci pintó la Mona Lisa entre 1503 y 1506. Es una de las obras de arte más famosas y valiosas del mundo.',
        image: '/placeholder.svg?height=400&width=300'
    },
]
function Card() {

    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const controls = useAnimation()

    const currentCard = cards[currentCardIndex]

    const handleFlip = () => {
        setIsFlipped(!isFlipped)
    }

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100 // Umbral para considerar un deslizamiento
        if (info.offset.x > threshold) {
            handleSwipe(true)
        } else if (info.offset.x < -threshold) {
            handleSwipe(false)
        } else {
            controls.start({ x: 0, rotate: 0 })
        }
    }

    const handleSwipe = (remembered: boolean) => {
        const direction = remembered ? 1 : -1
        controls.start({
            x: direction * 300,
            rotate: direction * 10,
            opacity: 0,
            transition: { duration: 0.3 }
        }).then(() => {
            setCurrentCardIndex((prevIndex) => (prevIndex + 1) % cards.length)
            setIsFlipped(false)
            controls.set({ x: 0, rotate: 0, opacity: 1 })
        })
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-sm">
                <motion.div
                    drag={isFlipped ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    className="bg-white rounded-xl shadow-lg overflow-hidden cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                >
                    <div className="relative h-[70vh] select-none">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentCard.image})` }} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black" />
                        <div className="absolute inset-0 flex flex-col p-4 text-white">
                            {!isFlipped ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <h2 className="text-2xl font-bold mb-4">{currentCard.question}</h2>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full justify-end">
                                    <h2 className="text-2xl font-bold mb-2">{currentCard.answer}</h2>
                                    <p className="text-sm">{currentCard.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
                <div className="flex justify-center space-x-4 mt-4">
                    {!isFlipped ? (
                        <button
                            onClick={handleFlip}
                            className="bg-white text-black rounded-full p-4 hover:bg-gray-200 transition-colors shadow-lg"
                            aria-label="Voltear tarjeta"
                        >
                            <RotateCw size={24} />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => handleSwipe(false)}
                                className="bg-red-500 text-white rounded-full p-4 hover:bg-red-600 transition-colors shadow-lg"
                                aria-label="No recordé"
                            >
                                <X size={24} />
                            </button>
                            <button
                                onClick={() => handleSwipe(true)}
                                className="bg-green-500 text-white rounded-full p-4 hover:bg-green-600 transition-colors shadow-lg"
                                aria-label="Sí recordé"
                            >
                                <Check size={24} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
export default Card; 