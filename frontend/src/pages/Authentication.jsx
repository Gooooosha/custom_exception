import {useState} from 'react';
import {Button, ConfigProvider, Form, Input, message, Modal} from 'antd';
import axios from 'axios';
import {useNavigate} from "react-router-dom";

const layout = {
    labelCol: {span: 6},
    wrapperCol: {span: 32},
};

const validateMessages = {
    required: 'Это поле обязательно!',
};

function LoginModal({isOpen, onClose, onLoginSuccess}) {
    const [messageApi, contextHolder] = message.useMessage();
    const navigate = useNavigate();

    const onFinish = (values) => {
        const {user: {login}, password} = values;
        axios.post(
            'http://127.0.0.1:8039/api/auth/login',
            {login, password},
            {withCredentials: true, timeout: 5000}
        )
            .then(() => {
                onClose();
                onLoginSuccess();
                navigate('/issues');
            })
            .catch(error => {
                messageApi.error(error.response?.data?.message || 'Ошибка при входе');
            });
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    fontSize: 16,
                    controlHeight: 45,
                    fontFamily: '',
                    colorPrimary: '#8A2BE2',
                    colorTextPlaceholder: '#777777',
                },
            }}
        >
            {contextHolder}
            <Modal open={isOpen} onCancel={onClose} footer={null} centered>
                <Form
                    {...layout}
                    name="login"
                    onFinish={onFinish}
                    validateMessages={validateMessages}
                    className='form-center'
                    style={{textAlign: 'center'}}
                >
                    <h1 style={{
                        fontSize: '2rem',
                        color: '#2c3959',
                        fontWeight: 'bold',
                        marginBottom: '20px'
                    }}>Вход</h1>
                    <Form.Item
                        name={['user', 'login']}
                        rules={[{required: true}]}
                        style={{width: '100%'}}
                    >
                        <Input placeholder="Введите ваш логин" style={{width: '80%'}}/>
                    </Form.Item>
                    <Form.Item
                        name='password'
                        rules={[{required: true}]}
                        style={{width: '100%'}}
                    >
                        <Input.Password placeholder="Введите пароль" style={{width: '80%'}}/>
                    </Form.Item>
                    <Form.Item style={{width: '100%'}}>
                        <Button type="primary" htmlType="submit" style={{width: '80%'}}>
                            Войти
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </ConfigProvider>
    );
}

export default function Authentication() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const onLoginSuccess = () => {
        message.success('Вход выполнен успешно!');
    };

    return (
        <div style={{
            position: 'fixed',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #000000 0%, #8A2BE2 50%, #E6E6FA 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
        }}>
            <h1 style={{fontSize: '4rem', color: '#ffffff', marginBottom: '20px'}}>Custom Exception</h1>
            <Button
                type="primary"
                size="large"
                style={{
                    backgroundColor: '#8A2BE2',
                    borderColor: '#ffffff',
                    width: '200px',
                    borderRadius: '30px',
                    height: '40px',
                    fontSize: '1rem'
                }}
                onClick={showModal}
            >
                Начать сейчас
            </Button>
            <LoginModal isOpen={isModalOpen} onClose={closeModal} onLoginSuccess={onLoginSuccess}/>
        </div>
    );
}