import React, { useState, useEffect, useRef } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format } from 'date-fns/format'
import { parse } from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import esES from 'date-fns/locale/es'
import { Pencil, Trash, Sun, Moon, RefreshCw } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import axios from 'axios';

const tableTask = 'http://localhost:8081/https://script.google.com/macros/s/AKfycbx_S-FnknXJNscLhmZF6KWCsl_MUeqF6ElrchzIYYfKIh16DEsPJycxSz0AMUZM2suQ/exec'

const locales = {
    'es': esES,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

class Task {
    id: number
    NameTask: string
    DateStart: Date
    DateEnd: Date
    status: 'not-started' | 'in-progress' | 'completed'
    Days: number
    Type: string
    NameUser: string
    startedAt?: Date
    completedAt?: Date
    constructor(
        id: number,
        NameTask: string,
        DateStart: Date,
        DateEnd: Date,
        status: 'not-started' | 'in-progress' | 'completed',
        Days: number,
        Type: string,
        NameUser: string,

    ) {
        this.id = id;
        this.NameTask = NameTask;
        this.DateStart = DateStart;
        this.DateEnd = DateEnd;
        this.status = status;
        this.Days = Days;
        this.Type = Type;
        this.NameUser = NameUser;
    }
}

const hours = Array.from({ length: 24 }, (_, i) => (i + 6) % 24)

export default function CalendarioTareasOptimizado() {
    //#region const
    const [tasks, setTasks] = useState<Task[]>([])
    const [newTask, setNewTask] = useState({ name: '', DateStart: '', DateEnd: '' })
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isDarkMode, setIsDarkMode] = useState(true)
    const [username, setUsername] = useState('')
    const dailyViewRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)
    //#endregion
    //#region effects

    useEffect(() => {

        const fetchData = async () => {
            try {
                const response = await axios.get(tableTask + "?table=definitionTask");
                const data: any[][] = response.data;

                // Los datos que llegan en formato de matriz (tabla), se pueden transformar en un objeto más fácil de manejar.
                const headers: string[] = data[0];
                const rows: any[][] = data.slice(1);

                const formattedTasks: Task[] = rows.map((row) => {
                    let task: any = {};
                    headers.forEach((header: string, index: number) => {
                        let valor = row[index];
                        if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(valor)) {
                            // Convertimos la cadena de fecha en un objeto Date usando el constructor nativo de Date
                            valor = new Date(valor);
                        }

                        task[header] = valor;
                    });
                    return task as Task;
                });
                const filteredTasksByName = formattedTasks.filter(task =>
                    task.NameUser === localStorage.getItem('username')
                )
                console.log(filteredTasksByName);
                setTasks(filteredTasksByName);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
            }
        };

        fetchData();
        document.documentElement.classList.toggle('dark', isDarkMode)
        const storedUsername = localStorage.getItem('username')
        if (storedUsername) {
            setUsername(storedUsername)
        }
    }, [isDarkMode])

    useEffect(() => {
        localStorage.setItem('username', username)
    }, [username])
    useEffect(() => {
        if (!("Notification" in window)) {
            console.log("Este navegador no soporta notificaciones de escritorio")
        } else {
            Notification.requestPermission()
        }
    }, [])
    useEffect(() => {
        const notificationChecks = tasks.map(task => {
            return setInterval(() => {
                const now = new Date()
                if (
                    task.DateStart.getDate() === now.getDate() &&
                    task.DateStart.getMonth() === now.getMonth() &&
                    task.DateStart.getFullYear() === now.getFullYear() &&
                    task.DateStart.getHours() === now.getHours() &&
                    task.DateStart.getMinutes() === now.getMinutes()
                ) {
                    new Notification("Recordatorio de tarea", {
                        body: `Es hora de tu tarea: ${task.NameTask}`,
                    })
                    if (audioRef.current) {
                        audioRef.current.play()
                    }
                }
            }, 60000) // Revisar cada minuto
        })

        return () => {
            notificationChecks.forEach(clearInterval)
        }
    }, [tasks])
    useEffect(() => {
        if (dailyViewRef.current) {
            const now = new Date()
            const currentHour = now.getHours()
            const scrollToElement = dailyViewRef.current.querySelector(`[data-hour="${currentHour}"]`)
            if (scrollToElement) {
                scrollToElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
    }, [selectedDate])
    //#endregion
    //#region api
    const sendDataTableFinish = async (tasku: Task) => {
        try {
            // Formato del objeto que se va a enviar
            const payload = {
                operation: "add",
                row: 4, // Aquí puedes ajustar el número de la fila que necesitas
                table: "completeTask",
                data: tasku // Aquí se coloca el array de tareas dentro del objeto "data"
            };
            console.log(payload);
            // Aquí haces el POST de las tareas
            const response = await axios.post(tableTask, payload);
            console.log('Datos enviados correctamente:', response.data);
        } catch (error) {
            console.error('Error al enviar los datos:', error);
        }
    };
    // Función para enviar los datos con POST
    const sendDataNewTask = async (tasku: Task) => {
        try {
            // Formato del objeto que se va a enviar
            const payload = {
                operation: "add",
                row: tasku.id, // Aquí puedes ajustar el número de la fila que necesitas
                table: "definitionTask",
                data: tasku // Aquí se coloca el array de tareas dentro del objeto "data"
            };
            console.log(payload);
            // Aquí haces el POST de las tareas
            const response = await axios.post(tableTask, payload);
            console.log('Datos enviados correctamente:', response.data);
        } catch (error) {
            console.error('Error al enviar los datos:', error);
        }
    };
    const editDataNewTask = async (tasku: Task) => {
        try {
            // Formato del objeto que se va a enviar
            const payload = {
                operation: "edit",
                id: tasku.id, // Aquí puedes ajustar el número de la fila que necesitas
                table: "definitionTask",
                data: tasku // Aquí se coloca el array de tareas dentro del objeto "data"
            };
            console.log(payload);
            // Aquí haces el POST de las tareas
            const response = await axios.post(tableTask, payload);
            console.log('Datos enviados correctamente:', response.data);
        } catch (error) {
            console.error('Error al enviar los datos:', error);
        }
    };
    const deleteDataNewTask = async (tasku: Task) => {
        try {
            // Formato del objeto que se va a enviar
            const payload = {
                operation: "delete",
                id: tasku.id, // Aquí puedes ajustar el número de la fila que necesitas
                table: "definitionTask",
            };
            console.log(payload);
            // Aquí haces el POST de las tareas
            const response = await axios.post(tableTask, payload);
            console.log('Datos enviados correctamente:', response.data);
        } catch (error) {
            console.error('Error al enviar los datos:', error);
        }
    };

    //#endregion
    //#region handle
    const handleAddTask = () => {
        if (newTask.name && newTask.DateStart && newTask.DateEnd) {
            const DateStart = new Date(selectedDate)
            DateStart.setHours(parseInt(newTask.DateStart.split(':')[0]), parseInt(newTask.DateStart.split(':')[1]))
            const DateEnd = new Date(selectedDate)
            DateEnd.setHours(parseInt(newTask.DateEnd.split(':')[0]), parseInt(newTask.DateEnd.split(':')[1]))
            const tasku = new Task(Date.now(),
                newTask.name,
                DateStart,
                DateEnd,
                'not-started',
                0,
                "everyday",
                username);

            const taskArray: Task[] = [tasku]
            // tasks.concat(taskArray)
            setTasks(wordList => [...wordList, ...taskArray])
            setNewTask({ name: '', DateStart: '', DateEnd: '' })
            setIsDialogOpen(false)
            sendDataNewTask(tasku);
        }
    }

    const handleEditTask = () => {
        if (editingTask) {
            setTasks(tasks.map(task =>
                task.id === editingTask.id ? editingTask : task
            ))
            editDataNewTask(editingTask);
            setEditingTask(null)
            setIsEditDialogOpen(false)
        }
    }

    const handleDeleteTask = () => {
        if (editingTask) {
            setTasks(tasks.filter(task => task.id !== editingTask.id))
            deleteDataNewTask(editingTask);
            setEditingTask(null)
            setIsEditDialogOpen(false)
        }
    }

    const handleTaskAction = (id: number, action: 'start' | 'complete') => {
        setTasks(tasks.map(task => {
            if (task.id === id) {
                const now = new Date()
                const newStatus = action === 'start' ? 'in-progress' : 'completed'
                const newStreak = newStatus === 'completed' ? task.Days + 1 : task.Days
                task.startedAt = action === 'start' ? now : task.startedAt
                task.completedAt = action === 'complete' ? now : task.completedAt
                if (newStatus === 'completed') {
                    sendDataTableFinish(task)
                }
                return {
                    ...task,
                    status: newStatus,
                    streak: newStreak,
                    startedAt: action === 'start' ? now : task.startedAt,
                    completedAt: action === 'complete' ? now : task.completedAt

                }

            }

            return task
        }))
    }
    const handleResetPage = () => {
        window.location.reload()
    }
    const filteredTasks = tasks.filter(task =>
        task.DateStart.toDateString() === selectedDate.toDateString()
    )
    //#endregion

    const calendarStyles = `
  .rbc-btn-group button {
    color: ${isDarkMode ? 'white' : 'black'};
    background-color: ${isDarkMode ? '#4a5568' : '#e2e8f0'};
  }
  .rbc-btn-group button:hover {
    background-color: ${isDarkMode ? '#2d3748' : '#cbd5e0'};
  }
  .rbc-off-range-bg {
    background-color: ${isDarkMode ? '#2d3748' : '#f7fafc'};
  }
  .rbc-today {
    background-color: ${isDarkMode ? '#4a5568' : '#e2e8f0'};
  }
  .rbc-active {
    background-color: ${isDarkMode ? '#2b6cb0' : '#3182ce'} !important;
    color: white !important;
  }
  .rbc-event {
    background-color: ${isDarkMode ? '#2b6cb0' : '#3182ce'};
  }
  .rbc-show-more {
    color: ${isDarkMode ? '#63b3ed' : '#3182ce'};
  }
`
    return (
        <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
            <style>{calendarStyles}</style>
            <audio ref={audioRef} src="/noti.wav" />
            {/* Mini Calendario (izquierda) */}
            <div className={`w-64 p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md flex flex-col`}>
                <Calendar
                    localizer={localizer}
                    events={[]}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 400 }}
                    onSelectSlot={({ start }) => setSelectedDate(start as Date)}
                    // onNavigate={(date) => setSelectedDate(date)}
                    selectable
                    views={['month']}
                    defaultDate={new Date()}
                />
                <button
                    className={`mt-4 w-full py-2 px-4 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors duration-200`}
                    onClick={() => setIsDarkMode(!isDarkMode)}
                >
                    {isDarkMode ? <Sun className="inline-block mr-2 h-4 w-4" /> : <Moon className="inline-block mr-2 h-4 w-4" />}
                    {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                </button>
                <div className="mt-4 overflow-y-auto flex-grow">
                    <h3 className="font-bold mb-2">Rachas de tareas:</h3>
                    {tasks.map(task => (
                        <div key={task.id} className="mb-1">
                            {task.NameTask}: {task.Days} días
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center">
                    <div className="flex-grow">

                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full p-2 rounded text-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                            placeholder="Nombre"
                        />
                    </div>
                    <button
                        onClick={handleResetPage}
                        className={`ml-2 p-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors duration-200`}
                        aria-label="Recargar página"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                </div>


            </div>
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header fijo */}
                <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md z-10`}>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Vista Diaria: {format(selectedDate, 'dd/MM/yyyy')}</h1>
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            className={`py-2 px-4 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200`}
                        >
                            Agregar Tarea
                        </button>
                    </div>
                </div>
                {/* Vista Diaria (derecha) */}
                <div className="flex-1 overflow-y-auto p-4" ref={dailyViewRef}>
                    {hours.map(hour => (
                        <div key={hour} className="flex mb-4" data-hour={hour}>
                            <div className="w-20 text-right pr-4">{`${hour.toString().padStart(2, '0')}:00`}</div>
                            <div className={`flex-1 min-h-[60px] border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                {tasks
                                    .filter(task => task.DateStart.getHours() === hour)
                                    .map((task) => (
                                        <div
                                            key={task.id}
                                            className={`p-2 mb-1 rounded flex justify-between items-center ${task.status === 'completed' ? 'bg-green-600' :
                                                task.status === 'in-progress' ? 'bg-yellow-600' :
                                                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                                                }`}
                                        >
                                            <div className="flex-grow">
                                                <div>{task.NameTask}</div>
                                                <div className="text-sm">
                                                    {`${format(task.DateStart, 'HH:mm')} - ${format(task.DateEnd, 'HH:mm')}`}
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                {task.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleTaskAction(task.id, task.status === 'not-started' ? 'start' : 'complete')}
                                                        className={`mr-2 py-1 px-2 rounded text-sm ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200`}
                                                    >
                                                        {task.status === 'not-started' ? 'Iniciar' : 'Finalizar'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setEditingTask(task)
                                                        setIsEditDialogOpen(true)
                                                    }}
                                                    className={`py-1 px-2 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'} transition-colors duration-200`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
            {/* Diálogo para agregar tarea */}
            {isDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 rounded-lg max-w-md w-full`}>
                        <h2 className="text-2xl font-bold mb-4">Agregar Nueva Tarea</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-1">
                                    Nombre
                                </label>
                                <input
                                    id="name"
                                    value={newTask.name}
                                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                                    className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="DateStart" className="block text-sm font-medium mb-1">
                                    Hora de inicio
                                </label>
                                <input
                                    id="DateStart"
                                    type="time"
                                    value={newTask.DateStart}
                                    onChange={(e) => setNewTask({ ...newTask, DateStart: e.target.value })}
                                    className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="DateEnd" className="block text-sm font-medium mb-1">
                                    Hora de fin
                                </label>
                                <input
                                    id="DateEnd"
                                    type="time"
                                    value={newTask.DateEnd}
                                    onChange={(e) => setNewTask({ ...newTask, DateEnd: e.target.value })}
                                    className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={() => setIsDialogOpen(false)}
                                className={`py-2 px-4 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors duration-200`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddTask}
                                className={`py-2 px-4 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200`}
                            >
                                Agregar Tarea
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Diálogo para editar tarea */}
            {isEditDialogOpen && editingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 rounded-lg max-w-md w-full`}>
                        <h2 className="text-2xl font-bold mb-4">Editar Tarea</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="editName" className="block text-sm font-medium mb-1">
                                    Nombre
                                </label>
                                <input
                                    id="editName"
                                    value={editingTask.NameTask}
                                    onChange={(e) => setEditingTask({ ...editingTask, NameTask: e.target.value })}
                                    className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="editStartTime" className="block text-sm font-medium mb-1">
                                    Hora de inicio
                                </label>
                                <input
                                    id="editStartTime"
                                    type="time"
                                    value={format(editingTask.DateStart, 'HH:mm')}
                                    onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':')
                                        const newStartTime = new Date(editingTask.DateStart)
                                        newStartTime.setHours(parseInt(hours), parseInt(minutes))
                                        setEditingTask({ ...editingTask, DateStart: newStartTime })
                                    }}
                                    className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label htmlFor="editEndTime" className="block text-sm font-medium mb-1">
                                    Hora de fin
                                </label>
                                <input
                                    id="editEndTime"
                                    type="time"
                                    value={format(editingTask.DateEnd, 'HH:mm')}
                                    onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':')
                                        const newEndTime = new Date(editingTask.DateEnd)
                                        newEndTime.setHours(parseInt(hours), parseInt(minutes))
                                        setEditingTask({ ...editingTask, DateEnd: newEndTime })
                                    }}
                                    className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-between">
                            <button
                                onClick={handleDeleteTask}
                                className={`py-2 px-4 rounded bg-red-600 hover:bg-red-700 text-white transition-colors duration-200`}
                            >
                                <Trash className="h-4 w-4 inline-block mr-2" />
                                Eliminar Tarea
                            </button>
                            <div className="space-x-4">
                                <button
                                    onClick={() => setIsEditDialogOpen(false)}
                                    className={`py-2 px-4 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors duration-200`}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEditTask}
                                    className={`py-2 px-4 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200`}
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

}