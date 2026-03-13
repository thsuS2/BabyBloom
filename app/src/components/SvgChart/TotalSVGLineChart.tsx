/**
 * SVG 기반 종합 점수 라인 차트
 * 의존성: react-native, react-native-svg
 * 특징: 세로 점선 그리드, 점수 툴팁
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface TotalSVGLineChartColors {
    line?: string;
    fill?: string;
    point?: string;
    axis?: string;
    grid?: string;
    tooltip?: string;
    tooltipText?: string;
    labelText?: string;
    loadingText?: string;
}

interface TotalSVGLineChartProps {
    data: Array<[string, number]>;
    today?: string | number;
    width: number;
    height: number;
    maxValue?: number;
    unit?: string;
    colors?: TotalSVGLineChartColors;
}

const DEFAULT_COLORS: TotalSVGLineChartColors = {
    line: '#6B8E8E',
    fill: '#6B8E8E',
    point: '#6B8E8E',
    axis: '#E5E5E5',
    grid: '#E5E5E5',
    tooltip: '#6B8E8E',
    tooltipText: '#FFFFFF',
    labelText: '#999999',
    loadingText: '#999999',
};

const TotalSVGLineChartComponent = ({
    data,
    width,
    height,
    maxValue = 100,
    unit = '점',
    colors: colorsProp,
}: TotalSVGLineChartProps) => {
    const c = { ...DEFAULT_COLORS, ...colorsProp };
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const chartWidth = width * 0.85;
    const chartPadding = { top: 10, right: 5, bottom: 5, left: 5 };
    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = height - chartPadding.top - chartPadding.bottom;

    const points = useMemo(() => {
        if (data.length === 0) return [];

        const spacing = innerWidth / Math.max(data.length - 1, 1);

        return data.map(([label, value], i) => ({
            x: chartPadding.left + (data.length === 1 ? innerWidth / 2 : i * spacing),
            y: chartPadding.top + innerHeight - (value / maxValue) * innerHeight,
            label,
            value,
        }));
    }, [data, innerWidth, innerHeight, maxValue]);

    const linePath = useMemo(() => {
        if (points.length === 0) return '';

        const firstPoint = points[0];
        if (!firstPoint) return '';

        let path = `M ${firstPoint.x} ${firstPoint.y}`;
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point) {
                path += ` L ${point.x} ${point.y}`;
            }
        }
        return path;
    }, [points]);

    const areaPath = useMemo(() => {
        if (points.length === 0) return '';

        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        if (!firstPoint || !lastPoint) return '';

        const bottomY = chartPadding.top + innerHeight;
        let path = `M ${firstPoint.x} ${bottomY}`;
        path += ` L ${firstPoint.x} ${firstPoint.y}`;

        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point) {
                path += ` L ${point.x} ${point.y}`;
            }
        }

        path += ` L ${lastPoint.x} ${bottomY}`;
        path += ' Z';
        return path;
    }, [points, innerHeight]);

    const handlePointPress = (index: number) => {
        setSelectedIndex(selectedIndex === index ? null : index);
    };

    if (data.length === 0) {
        return (
            <View style={{ height: height + 30, width: chartWidth, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: c.loadingText, fontSize: 13 }}>차트 로딩중...</Text>
            </View>
        );
    }

    const gradientId = 'totalSVGChartGradient';

    return (
        <View style={[styles.container, { width: chartWidth, height: height + 30 }]}>
            <Svg width={chartWidth} height={height}>
                <Defs>
                    <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={c.fill} stopOpacity="0.4" />
                        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1" />
                    </LinearGradient>
                </Defs>

                {/* X축 라인 */}
                <Line
                    x1={chartPadding.left}
                    y1={chartPadding.top + innerHeight}
                    x2={chartWidth - chartPadding.right}
                    y2={chartPadding.top + innerHeight}
                    stroke={c.axis}
                    strokeWidth={1}
                />

                {/* 세로 점선 그리드 */}
                {points.map((point, index) => (
                    <Line
                        key={`y-strip-${index}`}
                        x1={point.x}
                        y1={chartPadding.top}
                        x2={point.x}
                        y2={chartPadding.top + innerHeight}
                        stroke={c.grid}
                        strokeWidth={1}
                        strokeDasharray="3,3"
                    />
                ))}

                {/* 영역 채우기 */}
                {areaPath && (
                    <Path
                        d={areaPath}
                        fill={`url(#${gradientId})`}
                    />
                )}

                {/* 라인 */}
                {linePath && (
                    <Path
                        d={linePath}
                        stroke={c.line}
                        strokeWidth={3}
                        fill="none"
                    />
                )}

                {/* 데이터 포인트 */}
                {points.map((point, index) => (
                    <Circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r={selectedIndex === index ? 6 : 4}
                        fill={c.point}
                    />
                ))}
            </Svg>

            {/* 터치 영역 및 툴팁 */}
            {points.map((point, index) => {
                const isFirstData = index === 0;
                const isLastData = index === points.length - 1;
                const isMaxValue = point.value >= maxValue * 0.85;

                let topPosition = 20;
                let leftPosition = -20;

                if (isFirstData) {
                    leftPosition = 10;
                } else if (isLastData) {
                    leftPosition = -40;
                }

                if (isMaxValue) {
                    topPosition = 40;
                }

                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.touchArea,
                            {
                                left: point.x - 20,
                                top: point.y - 20,
                            }
                        ]}
                        onPress={() => handlePointPress(index)}
                        activeOpacity={0.7}
                    >
                        {selectedIndex === index && (
                            <View style={[
                                styles.tooltip,
                                {
                                    top: topPosition - 30,
                                    left: leftPosition + 20,
                                    backgroundColor: c.tooltip,
                                }
                            ]}>
                                <Text style={[styles.tooltipText, { color: c.tooltipText }]}>
                                    {point.value}{unit}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}

            {/* X축 라벨 */}
            {points.map((point, index) => {
                const isFirst = index === 0;
                const isLast = index === points.length - 1;
                const translateX = isFirst ? -5 : isLast ? -15 : -10;

                return (
                    <Text
                        key={`label-${index}`}
                        style={{
                            position: 'absolute',
                            left: point.x,
                            bottom: 5,
                            transform: [{ translateX }],
                            fontSize: 11,
                            color: c.labelText,
                        }}
                    >
                        {point.label}
                    </Text>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        paddingLeft: 5,
    },
    touchArea: {
        position: 'absolute',
        width: 40,
        height: 40,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    tooltip: {
        position: 'absolute',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        minWidth: 45,
    },
    tooltipText: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
});

export const TotalSVGLineChart = React.memo(
    TotalSVGLineChartComponent,
    (prevProps, nextProps) => {
        return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
            && prevProps.width === nextProps.width
            && prevProps.height === nextProps.height
            && prevProps.today === nextProps.today;
    }
);
