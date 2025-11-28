import React from 'react';

export const TermsContent = () => (
    <div className="space-y-6 text-gray-800">
        <div className="bg-gray-50 p-4 rounded-lg text-sm border border-gray-100">
            <p><strong>버전:</strong> 1.0</p>
            <p><strong>시행일:</strong> 2025년 11월 28일</p>
            <p><strong>회사:</strong> 주식회사 북블라</p>
        </div>

        <section>
            <h2 className="text-xl font-bold mb-4 pb-2 border-b">[1] 서비스 이용약관</h2>

            <h3 className="text-lg font-bold mt-6 mb-3">제1장 총칙</h3>

            <div className="space-y-4">
                <div>
                    <h4 className="font-bold mb-1">제1조 (목적)</h4>
                    <p className="leading-relaxed">이 약관은 <strong>주식회사 북블라</strong>(이하 “회사”라 합니다)가 제공하는 독서 취향 기반 매칭 서비스 <strong>“언더라인(Underline)”</strong>(이하 “서비스”라 합니다)의 이용에 대한 회사와 회원 간의 권리ㆍ의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                </div>

                <div>
                    <h4 className="font-bold mb-1">제2조 (용어의 정의)</h4>
                    <p className="mb-2">① 이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li><strong>“회원”</strong>이란 이 약관에 따라 이용계약을 체결하고, 회사가 제공하는 서비스를 이용하는 자를 의미합니다.</li>
                        <li><strong>“서재(Bookshelf)”</strong>란 회원이 자신의 정체성을 표현하기 위해 등록한 도서 목록 및 서평 데이터를 말하며, 기존의 프로필 카드를 대체하거나 보완하는 역할을 합니다.</li>
                        <li><strong>“매칭”</strong>이란 회사의 알고리즘 및 회원의 신청(첫인사)과 수락 과정을 통해 회원 간의 대화가 가능한 상태로 연결되는 것을 말합니다.</li>
                        <li><strong>“골든벨(Golden Bell)”</strong>이란 매칭이 성사된 회원 중 1인이 결제할 경우, 쌍방 모두에게 상대방의 연락처(카카오톡 ID 등)가 공개되는 유료 서비스를 말합니다.</li>
                        <li><strong>“인증”</strong>이란 카카오톡 로그인(OpenID Connect) 등을 통해 가입신청자가 본인임을 확인하는 절차를 말합니다.</li>
                    </ol>
                    <p className="mt-2">② 이 약관에서 사용하는 용어의 정의는 본 조 제1항에서 정하는 것을 제외하고는 관계법령에서 정하는 바에 따르며, 이에 정하지 아니한 것은 일반적인 상관례에 따릅니다.</p>
                </div>

                <div>
                    <h4 className="font-bold mb-1">제3조 (약관의 효력 및 변경)</h4>
                    <p>① 회사는 이 약관의 내용을 회원이 알 수 있도록 서비스 화면 또는 그 연결 화면에 게시합니다.</p>
                    <p>② 회사가 약관을 개정할 경우에는 적용일자 및 개정내용, 개정 사유 등을 명시하여 최소한 그 적용일 7일 이전부터 서비스 화면에 공지합니다. 다만, 회원에게 불리한 변경의 경우 30일 이상의 유예기간을 두고 전자적 형태(이메일, 앱 푸시 등)로 개별 고지합니다.</p>
                    <p>③ 회원이 개정약관 시행일까지 거부의 의사표시를 하지 않는다면 개정약관에 동의한 것으로 봅니다.</p>
                </div>

                <div>
                    <h4 className="font-bold mb-1">제4조 (약관의 해석)</h4>
                    <p>이 약관에서 정하지 아니한 사항은 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령에 따릅니다.</p>
                </div>
            </div>

            <h3 className="text-lg font-bold mt-8 mb-3">제2장 서비스 이용계약</h3>

            <div className="space-y-4">
                <div>
                    <h4 className="font-bold mb-1">제5조 (이용계약의 체결)</h4>
                    <p>① 이용계약은 가입신청자가 약관에 동의하고, <strong>‘인생 책’ 및 ‘서평’</strong> 등 회사가 요구하는 필수 정보를 입력하여 가입을 신청하면, 회사가 이를 승낙함으로써 체결됩니다.</p>
                    <p>② 회사는 다음 각 호에 해당하는 신청에 대하여 승낙을 거부하거나 사후에 이용계약을 해지할 수 있습니다.</p>
                    <ol className="list-decimal pl-5 space-y-1 mt-1">
                        <li>타인의 명의나 사진, 저작물(서평 등)을 도용한 경우</li>
                        <li>사회의 안녕과 질서 또는 미풍양속을 저해할 목적으로 신청한 경우 (음란물 프로필 등)</li>
                        <li>법률상 미성년자(만 19세 미만)인 경우</li>
                        <li>법률상 혼인 상태임에도 이를 숨기고 가입한 경우</li>
                        <li>영리 목적이나 범죄 목적으로 서비스를 이용하려는 경우</li>
                    </ol>
                    <p className="mt-2">③ 회원은 회원 가입 시 기재한 정보(책 취향, 사진 등)가 변경된 경우 이를 수정하여야 하며, 수정하지 않아 발생하는 불이익은 회원이 부담합니다.</p>
                </div>

                <div>
                    <h4 className="font-bold mb-1">제6조 (회원에 대한 통지)</h4>
                    <p>회사는 회원에게 통지해야 할 경우, 회원이 등록한 전화번호(알림톡), 앱 내 푸시 알림, 이메일 등으로 통지할 수 있습니다. 불특정 다수 회원에 대한 통지의 경우 7일 이상 서비스 게시판에 게시함으로써 개별 통지에 갈음할 수 있습니다.</p>
                </div>
            </div>

            <h3 className="text-lg font-bold mt-8 mb-3">제3장 서비스의 내용 및 이용</h3>

            <div className="space-y-4">
                <div>
                    <h4 className="font-bold mb-1">제7조 (서비스의 내용 및 운영 정책)</h4>
                    <p>회사가 제공하는 “언더라인” 서비스는 <strong>주간 단위(Weekly Batch)</strong>로 운영되며 내용은 다음과 같습니다.</p>
                    <p>① <strong>신청 기간 (일~목):</strong> 회원은 자신의 서재를 꾸미고, 이번 주의 소개팅 참가를 신청합니다.</p>
                    <p>② <strong>매칭 및 공개 기간 (금~토):</strong> 매칭된 이성 리스트가 공개되며, 상호작용(신청/수락)을 할 수 있습니다.</p>
                    <p>③ <strong>블라인드 정책:</strong> 회원의 사진은 기본적으로 블러(Blur) 처리되어 제공되며, 매칭이 성사(수락)된 이후에 원본이 공개됩니다.</p>
                    <p>④ <strong>서평 기반 매칭:</strong> 회사는 회원이 작성한 서평과 독서 데이터를 분석하여 적합한 상대를 추천합니다.</p>
                    <p>⑤ 회사는 서비스 품질 유지를 위해 불성실한 서평이나 부적절한 사진을 등록한 회원의 서비스 이용을 제한할 수 있습니다.</p>
                </div>

                <div>
                    <h4 className="font-bold mb-1">제8조 (개인정보의 보호)</h4>
                    <p>회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력하며, 개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 '개인정보 처리방침'에 따릅니다.</p>
                </div>
            </div>

            <h3 className="text-lg font-bold mt-8 mb-3">제4장 계약 당사자의 의무</h3>

            <div className="space-y-4">
                <div>
                    <h4 className="font-bold mb-1">제9조 (회사의 의무)</h4>
                    <p>① 회사는 법령과 이 약관이 금지하는 행위를 하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위하여 최선을 다합니다.</p>
                    <p>② 회사는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보 보호를 위한 보안 시스템을 갖추어야 합니다.</p>
                </div>

                <div>
                    <h4 className="font-bold mb-1">제10조 (회원의 의무)</h4>
                    <p>① 회원은 다음 행위를 하여서는 안 됩니다.</p>
                    <ol className="list-decimal pl-5 space-y-1 mt-1">
                        <li>타인의 서평이나 글을 무단으로 복제하여 자신의 것처럼 등록하는 행위 (저작권 침해)</li>
                        <li>허위 정보(가짜 프로필, 타인 사칭)를 등록하는 행위</li>
                        <li>상대방의 동의 없이 대화 내용이나 신상 정보를 캡처하여 외부에 유출하는 행위</li>
                        <li>성희롱, 비방, 욕설 등 상대방에게 모욕감을 주는 행위</li>
                        <li>매칭 성사 후 정당한 사유 없이 연락을 회피하거나 잠적하는 행위</li>
                    </ol>
                    <p className="mt-2">② 회원이 제1항을 위반할 경우, 회사는 경고, 일시정지, 영구정지 및 강제 탈퇴 조치를 취할 수 있으며, 이로 인한 피해에 대해 민형사상 책임을 물을 수 있습니다.</p>
                </div>
            </div>

            <h3 className="text-lg font-bold mt-8 mb-3">제5장 유료 서비스 및 환불</h3>

            <div className="space-y-4">
                <div>
                    <h4 className="font-bold mb-1">제11조 (골든벨 서비스 및 결제)</h4>
                    <p>① “언더라인”의 유료 서비스는 <strong>‘골든벨(상대방 연락처 확인)’</strong>입니다.</p>
                    <p>② 매칭이 성사된 쌍방 중, 한 명이라도 이용 요금을 결제(골든벨을 울림)하면 <strong>즉시 쌍방 모두에게 상대방의 연락처(카카오톡 ID 등)가 공개</strong>됩니다.</p>
                    <p>③ 결제는 회사가 제공하는 결제 수단(PG사, 인앱결제 등)을 통해 이루어집니다.</p>
                </div>

                <div>
                    <h4 className="font-bold mb-1">제12조 (청약철회 및 환불)</h4>
                    <p>① <strong>[청약철회의 제한]</strong> 회원이 결제하여 골든벨을 울리고 <strong>상대방의 연락처가 화면에 공개된 시점</strong>부터는, 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 '디지털 콘텐츠의 제공이 개시된 경우'로 간주되어 <strong>청약철회(환불)가 불가능합니다.</strong></p>
                    <p>② 단, 다음 각 호의 경우에는 전액 환불이 가능합니다.</p>
                    <ol className="list-decimal pl-5 space-y-1 mt-1">
                        <li>회사의 시스템 오류로 중복 결제가 된 경우</li>
                        <li>결제를 완료하였으나, 시스템 오류로 인해 연락처가 공개되지 않은 경우</li>
                        <li>상대방이 탈퇴하거나 이용 정지되어, 결제 직후 연락처 확인이 원천적으로 불가능했던 경우</li>
                    </ol>
                    <p className="mt-2">③ 회원은 상대방의 외모, 말투, 단순 변심 등의 주관적 사유로는 환불을 요청할 수 없습니다.</p>
                </div>
            </div>

            <h3 className="text-lg font-bold mt-8 mb-3">제6장 손해배상 및 기타</h3>

            <div className="space-y-4">
                <div>
                    <h4 className="font-bold mb-1">제13조 (손해배상 및 면책)</h4>
                    <p>① 회사는 무료로 제공되는 서비스 이용과 관련하여 회원에게 발생한 손해에 대해서는 책임을 지지 않습니다.</p>
                    <p>② 회사는 회원 간의 매칭 성공을 보장하지 않으며, 회원이 작성한 프로필 정보(서평 내용, 신원 정보 등)의 진실성을 보증하지 않습니다.</p>
                    <p>③ 회사는 회원 간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁(오프라인 만남에서의 사고, 금전 거래 등)에 대해 개입할 의무가 없으며, 이에 대한 책임을 지지 않습니다.</p>
                    <p>④ 회사는 천재지변, 디도스(DDoS) 공격, IDC 장애 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                </div>

                <div>
                    <h4 className="font-bold mb-1">제14조 (준거법 및 관할법원)</h4>
                    <p>이 약관의 해석 및 회사와 회원 간의 분쟁에 대하여는 대한민국 법률을 적용하며, 분쟁 발생 시 회사의 본점 소재지를 관할하는 법원을 관할법원으로 합니다.</p>
                </div>
            </div>
        </section>
    </div>
);

export const PrivacyContent = () => (
    <div className="space-y-6 text-gray-800">
        <div className="bg-gray-50 p-4 rounded-lg text-sm border border-gray-100">
            <p><strong>버전:</strong> 1.0</p>
            <p><strong>시행일:</strong> 2025년 11월 28일</p>
            <p><strong>회사:</strong> 주식회사 북블라</p>
        </div>

        <section>
            <p className="leading-relaxed">
                <strong>주식회사 북블라</strong>(이하 “회사”라 합니다)는 이용자의 동의를 기반으로 개인정보를 수집ㆍ이용 및 제공하고 있으며, 「개인정보 보호법」 등 관계 법령 및 규정, 가이드라인을 준수하고 있습니다. 회사는 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침을 수립ㆍ공개합니다.
            </p>

            <div className="space-y-6 mt-6">
                <div>
                    <h4 className="font-bold text-lg mb-2">제1조 (개인정보의 수집 및 이용 목적)</h4>
                    <p className="mb-2">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>
                            <strong>회원 가입 및 관리</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li>회원 가입의사 확인, SNS(카카오) 연동을 통한 본인 식별ㆍ인증</li>
                                <li>회원 유지ㆍ관리, 불량 회원의 부정 이용 방지</li>
                                <li>가입 및 가입횟수 제한, 만 19세 미만 아동의 가입 제한</li>
                            </ul>
                        </li>
                        <li>
                            <strong>서비스 제공</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li>독서 취향(서재/서평) 분석 기반의 이성 매칭 서비스 제공</li>
                                <li>유료 서비스(골든벨) 구매 및 이용 시 요금 정산</li>
                                <li>매칭 성사 시 연락처 교환, 공지사항 전달</li>
                            </ul>
                        </li>
                        <li>
                            <strong>고충처리</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li>민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락ㆍ통지</li>
                                <li>처리결과 통보, 서비스의 원활한 운영에 지장을 주는 행위(계정 도용, 성희롱, 비매너 행위 등)에 대한 방지 및 제재</li>
                            </ul>
                        </li>
                        <li>
                            <strong>신규 서비스 개발 및 마케팅</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li>신규 서비스 개발, 통계학적 특성에 따른 서비스 제공 및 광고 게재</li>
                                <li>접속 빈도 파악, 회원의 서비스 이용에 대한 통계(인기 도서 분석 등)</li>
                            </ul>
                        </li>
                    </ol>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제2조 (수집하는 개인정보의 항목)</h4>
                    <p className="mb-2">회사가 운영하는 서비스 이용에 필수로 필요한 항목과 회원의 선택에 따라 수집되는 항목이 있으며, 구체적인 항목은 아래와 같습니다.</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>
                            <strong>필수 수집 항목</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li><strong>계정 정보:</strong> 성명(닉네임), 이메일 주소, 프로필 사진 (카카오톡 연동 정보)</li>
                                <li><strong>매칭용 정보:</strong> <strong>실제 연락처용 카카오톡 ID</strong>, 성별, 생년월일</li>
                                <li><strong>취향 정보:</strong> 등록한 도서 목록(서재), 직접 작성한 서평 및 인생 책 데이터</li>
                            </ul>
                        </li>
                        <li>
                            <strong>선택적 수집 항목</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li>정보 주체가 매칭 확률을 높이기 위해 입력하는 프로필 정보: 직업, 학력, 거주지역, 키, 흡연/음주 여부, 가치관 등</li>
                            </ul>
                        </li>
                        <li>
                            <strong>서비스 이용 과정에서 자동 수집되는 항목</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li>서비스 이용기록, 접속 로그, 접속 IP 정보, 쿠키, 불량 이용기록, 모바일 기기정보(OS 버전, 기기 모델명 등), 결제 기록(승인번호, 거래금액 등)</li>
                            </ul>
                        </li>
                    </ol>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제3조 (개인정보의 수집 방법)</h4>
                    <p className="mb-2">회사는 개인정보를 수집하는 경우에는 반드시 사전에 이용자에게 해당 사실을 알리고 동의를 구하고 있으며, 아래와 같은 방법을 통해 개인정보를 수집합니다.</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>회원가입 및 서비스 이용 과정에서 이용자가 카카오톡 로그인(OpenID)을 통해 정보 제공에 동의하는 경우</li>
                        <li>이용자가 프로필 설정 및 서재 관리 페이지에서 직접 정보를 입력ㆍ수정하는 경우</li>
                        <li>고객센터를 통한 상담 과정에서 웹페이지, 메일, 채널톡 등을 통한 수집</li>
                        <li>이벤트 및 행사에 참여하며 배송지 정보 등을 입력하는 경우</li>
                    </ol>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제4조 (개인정보의 보유기간 및 파기)</h4>
                    <p className="mb-2">정보주체의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다. 단, 관계 법령 및 회사 내부 방침에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 안전하게 보관합니다.</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>
                            <strong>회사 내부 방침에 의한 정보 보유</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li><strong>부정이용 방지 및 재가입 제한:</strong> 회원 탈퇴 후 1년 (불량 회원의 재가입 방지 및 분쟁 해결 목적)</li>
                                <li><strong>보유 항목:</strong> 카카오 회원 식별자(CI), 중복가입 방지 정보, 부정/위반 이용 행위 기록, 징계 기록</li>
                            </ul>
                        </li>
                        <li>
                            <strong>관련 법령에 의한 정보 보유</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                                <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
                            </ul>
                        </li>
                    </ol>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제5조 (개인정보의 제3자 제공에 관한 사항)</h4>
                    <p className="mb-2">회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, <strong>서비스의 핵심 기능인 '매칭' 및 '연락처 교환'을 위해 아래와 같이 제한적으로 제공</strong>합니다.</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>
                            <strong>매칭 상대방 (서비스 이용자)</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li><strong>제공받는 자:</strong> 매칭이 성사되고 유료 결제(골든벨)가 완료된 <strong>상대방 회원</strong></li>
                                <li><strong>제공 목적:</strong> 매칭 성사에 따른 상호 연락 및 대화</li>
                                <li><strong>제공 항목:</strong> <strong>카카오톡 ID</strong>, 닉네임, 공개된 프로필 정보(서재, 서평 포함)</li>
                                <li><strong>보유 및 이용기간:</strong> 매칭 성사 시점부터 영구(상대방이 직접 삭제 시까지)</li>
                            </ul>
                        </li>
                    </ol>
                    <p className="mt-2 text-sm text-gray-500">※ 그 외 관할 행정부처나 수사기관의 적법한 요구가 있는 경우 법령에 따라 제공될 수 있습니다.</p>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제6조 (개인정보처리의 위탁에 관한 사항)</h4>
                    <p className="mb-2">회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>
                            <strong>서버 및 데이터 관리</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li><strong>수탁업체:</strong> Supabase Inc., Vercel Inc.</li>
                                <li><strong>위탁업무:</strong> 서비스 데이터베이스 저장, 클라우드 서버 운영</li>
                            </ul>
                        </li>
                        <li>
                            <strong>결제 처리</strong>
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                                <li><strong>수탁업체:</strong> (주)포트원 (또는 토스페이먼츠, 카카오페이 등 실제 계약사)</li>
                                <li><strong>위탁업무:</strong> 유료 서비스 결제 대행 및 매매보호(에스크로)</li>
                            </ul>
                        </li>
                    </ol>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제7조 (정보주체의 권리‧의무 및 행사방법)</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입 해지(탈퇴)를 요청할 수 있습니다.</li>
                        <li>이용자가 개인정보의 오류에 대한 정정을 요청한 경우, 정정을 완료하기 전까지 당해 개인정보를 이용 또는 제공하지 않습니다.</li>
                        <li>권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</li>
                    </ol>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제8조 (개인정보의 안전성 확보조치)</h4>
                    <p className="mb-2">회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li><strong>관리적 조치:</strong> 내부관리계획 수립․시행, 정기적인 직원 교육 등</li>
                        <li><strong>기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                        <li><strong>물리적 조치:</strong> 전산실, 자료보관실 등의 접근통제</li>
                    </ol>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제9조 (개인정보 자동 수집 장치의 설치∙운영 및 거부에 관한 사항)</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 ‘쿠키(cookie)’ 등을 사용합니다.</li>
                        <li>이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹브라우저/앱 설정에서 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.</li>
                    </ol>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제10조 (개인정보 보호책임자)</h4>
                    <p className="mb-2">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 회원의 고충 처리를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                        <p><strong>개인정보 보호책임자 (CPO)</strong></p>
                        <ul className="list-disc pl-5 mt-1 text-sm">
                            <li><strong>성명:</strong> 고도현</li>
                            <li><strong>직위:</strong> 대표이사</li>
                            <li><strong>이메일:</strong> unicorn6402@bookbla.com</li>
                            <li><strong>전화번호:</strong> 070-8065-7296</li>
                        </ul>
                    </div>
                    <p className="mt-4 mb-2">기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다.</p>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                        <li>개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
                        <li>대검찰청 사이버수사과 (www.spo.go.kr / 국번없이 1301)</li>
                        <li>경찰청 사이버수사국 (ecrm.cyber.go.kr / 국번없이 182)</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-lg mb-2">제11조 (개인정보처리방침 변경에 관한 사항)</h4>
                    <p>이 개인정보처리방침은 <strong>2025년 11월 28일</strong>부터 적용됩니다. 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 공지사항을 통해 고지할 것입니다.</p>
                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                        <li><strong>공고일자:</strong> 2025년 11월 28일</li>
                        <li><strong>시행일자:</strong> 2025년 11월 28일</li>
                    </ul>
                </div>

                <div className="border-t pt-6 mt-8">
                    <h4 className="font-bold mb-2">[사업자 정보]</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        <li><strong>상호:</strong> 주식회사 북블라 (Bookbla Inc.)</li>
                        <li><strong>대표이사:</strong> 고도현</li>
                        <li><strong>사업자등록번호:</strong> 206-88-02996</li>
                        <li><strong>주소:</strong> 경기도 성남시 성남대로 1342 AI공학관 617호</li>
                        <li><strong>제휴 및 문의:</strong> unicorn6402@bookbla.com</li>
                        <li><strong>대표번호:</strong> 070-8065-7296</li>
                    </ul>
                </div>
            </div>
        </section>
    </div>
);
