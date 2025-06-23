import {Route, Routes} from "react-router-dom";
import Issues from "./pages/Issues.jsx";
import Authentication from "./pages/Authentication.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import {Result} from "antd";
import {FrownOutlined} from "@ant-design/icons";
import Notifications from "./pages/Notifications.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DataTransfer from "./pages/DataTransfer.jsx";
import Projects from "./pages/Projects.jsx";
import Users from "./pages/Users.jsx";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Authentication/>}/>
            <Route path="/projects" element={
                <PrivateRoute allowedRoles={['admin', 'project_manager']}>
                    <Projects/>
                </PrivateRoute>
            }/>

            <Route path="/issues" element={
                <PrivateRoute allowedRoles={['admin', 'project_manager', 'user']}>
                    <Issues/>
                </PrivateRoute>
            }/>

            <Route path="/notifications" element={
                <PrivateRoute allowedRoles={['admin', 'project_manager']}>
                    <Notifications/>
                </PrivateRoute>
            }/>

            <Route path="/dashboard" element={
                <PrivateRoute allowedRoles={['admin', 'project_manager', 'user']}>
                    <Dashboard/>
                </PrivateRoute>
            }/>

            <Route path="/datatransfer" element={
                <PrivateRoute allowedRoles={['admin', 'project_manager', 'user']}>
                    <DataTransfer/>
                </PrivateRoute>
            }/>

            <Route path="/users" element={
                <PrivateRoute allowedRoles={['admin']}>
                    <Users/>
                </PrivateRoute>
            }/>

            <Route path="*" element={
                <div style={{
                    backgroundColor: '#2e2e2e',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Result
                        icon={<FrownOutlined style={{fontSize: '120px', color: '#e8aa0e'}}/>}
                        title={<span style={{color: '#fff'}}>404</span>}
                        subTitle={<span style={{color: '#aaa'}}>Страница не найдена...</span>}
                    />
                </div>
            }/>
        </Routes>
    );
}