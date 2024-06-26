import styles from './login-mobile.module.less';
import React, { useEffect, useState, useRef } from 'react';
import { Form, Input, Button, Row, Col, Divider, Toast } from '@douyinfe/semi-ui';
import { userService } from '@server/index';
import { pubsub } from '@utils/index';
function LoginMobile({ setShow }: any) {
  const [captcha, setCaptcha] = useState({
    key: '',
    code: '',
  });
  const formRef = useRef<any>();
  const formApiRef = useRef<any>();
  const timer = useRef<any>();
  const [time, setTime] = useState(60);

  const onFinish = async (values: any) => {
    // 1、登录成功后自动设置x-token
    // const res = await userService.login({ ...values, captchaKey: captcha.key });
    const [res, err] = await userService.login({
      mobile: values.telphone,
      code: values.phoneCode,
      type: 'mobile_code',
    });

    if (res) {
      Toast.success('登录成功！');
    } else {
      Toast.error(err);
    }
    if (err) {
      // 切换验证码
      getImageKey();
      return;
    }
    // 2、获取用户详情，设置x-user-info
    const [userRes, userError] = await userService.getUserDetail();
    if (userRes) {
      (window as any).RouterHistory.push('./manage');
      pubsub.publish('showLoginModal', false);
    }
  };
  useEffect(() => {
    getImageKey();
  }, []);

  const getImageKey = async () => {
    const [res, err] = await userService.getCaptcha();
    console.log(res);
    if (res) {
      setCaptcha({
        code: res.captcha_code,
        key: res.captcha_key,
      });
    }
  };

  const getFormApi = formApi => {
    formApiRef.current = formApi;
  };

  // 发送手机验证码
  const sendSMS = async () => {
    console.log('formApiRef.current', formApiRef.current);
    const { telphone, captchaCode } = formApiRef.current.getValues();
    console.log('formApiRef.current', formApiRef.current.getValues());
    if (!/^1\d{10}$/.test(telphone)) {
      Toast.error('请输入正确的手机号');
      return;
    }
    if (!captchaCode) {
      Toast.error({ content: '请输入图形验证码', duration: 10000 });
      return;
    }
    // 发送验证码
    const [res, err] = await userService.getLoginSMS({
      mobile: telphone,
      captchaCode: captchaCode,
      captchaKey: captcha.key,
    });
    if (res) {
      Toast.success('验证码已发送，注意查收');
    } else {
      Toast.error(err);
    }

    let t = 60;
    timer.current = setInterval(() => {
      if (t - 1 === 0) {
        clearInterval(timer.current);
        setTime(60);
        return;
      }
      t--;
      setTime(t);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, []);

  return (
    <div className={styles.loginMobile}>
      <p className={styles.title}>
        <span className={styles.text}>手机登录</span>
      </p>
      <Form name="basic" ref={formRef} getFormApi={getFormApi} onSubmit={onFinish}>
        <Row gutter={8} className={styles.fromItem}>
          <Col span={24}>
            <Form.Input
              noLabel
              field="telphone"
              rules={[{ required: true, message: '请输入手机号' }]}
              placeholder="请输入手机号"
            />
          </Col>
        </Row>
        <Row gutter={8} className={styles.fromItem}>
          <Col span={16}>
            <Form.Input
              noLabel
              field="captchaCode"
              rules={[{ required: true, message: '请输入图形验证码' }]}
              placeholder="请输入图形验证码"
            />
            {/* <Input  name="captchaCode" placeholder="请输入图形验证码" className={styles.codeNum}/> */}
          </Col>
          <Col span={8}>
            <img
              onClick={getImageKey}
              style={{ width: '100%', height: 32, display: 'flex', alignItems: 'center' }}
              src={captcha.code}
              alt=""
            />
          </Col>
        </Row>
        <Row gutter={8} className={styles.fromItem}>
          <Col span={16}>
            <Form.Input
              noLabel
              field="phoneCode"
              rules={[{ required: true, message: '请输入手机验证码' }]}
              placeholder="手机验证码"
            />
          </Col>
          <Col span={8}>
            <Button style={{ height: 35 }} block={true} onClick={sendSMS} disabled={time !== 60}>
              {time === 60 ? '发送验证码' : `${time}秒后重试`}
            </Button>
          </Col>
        </Row>
        <Row gutter={8} className={styles.fromBtnItem}>
          <Col span={24}>
            <Button type="primary" htmlType="submit" block={true}>
              立即登录
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

export default LoginMobile;
