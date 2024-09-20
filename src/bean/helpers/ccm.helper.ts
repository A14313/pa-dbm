//import axios from ‘axios’;

export class CCMHelper{
    
    public static async getToken() {
        console.log('GetTOKEN triggered')
        // const data = {
        //     service: bean.envProp('CCM_SERVICE'),
        //     clientid: bean.envProp('CCM_CLIENT_ID'),
        //     secret: bean.envProp('CCM_SERVICE_SECRET'),
        // };
       
        // const headers = {
        //     ‘accept’: ‘application/json’,
        //     ‘Content-Type’: ‘application/json’,
        //   };

        // try {
        //     const response = await axios.post(url, data, { headers });
        //     if (response.status === 200) {
        //       const responseData = response.data;
        //       if (responseData.success) {
        //         res.status(200).json({ token: responseData.result.token });
        //       } else {
        //         res.status(400).json({ error: responseData.message || ‘Unknown error’ });
        //       }
        //     } else {
        //       res.status(response.status).json({ error: `HTTP Error: ${response.status}` });
        //     }
        //   } catch (error) {
        //     res.status(500).json({ error: `Request Error: ${error.message}` });
        //   }

        var tokenResult = 'ahahah';
        return tokenResult

    }

    public static async getPolicyDetails(policyRef: string) {
        let token = await CCMHelper.getToken()
        console.log(token)
    }
}